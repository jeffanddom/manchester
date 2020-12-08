import { mat2d, vec2 } from 'gl-matrix'

import { Canvas3DRenderer } from './renderer/Canvas3DRenderer'

import { Camera } from '~/Camera'
import {
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/constants'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression, initMap } from '~/Game'
import { IKeyboard } from '~/Keyboard'
import { Map } from '~/map/interfaces'
import { Mouse } from '~/Mouse'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import {
  IRenderer,
  Primitive,
  Renderable,
  TextAlign,
} from '~/renderer/interfaces'
import { simulate } from '~/simulate'
import * as systems from '~/systems'
import { CursorMode } from '~/systems/client/playerInput'
import * as terrain from '~/terrain'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export class Client {
  entityManager: EntityManager
  localMessageHistory: ClientMessage[]
  playerInputState: {
    cursorMode: CursorMode
  }
  serverConnection: IServerConnection | null
  playerNumber: number
  serverFrameUpdates: {
    frame: number
    inputs: ClientMessage[]
  }[]
  committedFrame: number
  simulationFrame: number
  waitingForServer: boolean

  camera: Camera
  debugDrawRenderables: Renderable[]
  debugDrawViewspace: Renderable[]
  emitters: ParticleEmitter[]
  emitterHistory: Set<string>
  enableDebugDraw: boolean
  renderer: IRenderer
  lastUpdateAt: number
  lastTickAt: number
  lastRenderAt: number
  serverUpdateFrameDurationAvg: number
  serverSimulationDurationAvg: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage
  renderDurations: RunningAverage
  renderFrameDurations: RunningAverage
  framesAheadOfServer: RunningAverage
  serverInputsPerFrame: RunningAverage

  keyboard?: IKeyboard
  mouse?: Mouse

  // Common game state
  state: GameState
  nextState: GameState | undefined

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor(canvas: HTMLCanvasElement) {
    this.entityManager = new EntityManager([
      [0, 0],
      [0, 0],
    ])
    this.localMessageHistory = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverConnection = null
    this.playerNumber = -1
    this.serverFrameUpdates = []
    this.committedFrame = -1
    this.simulationFrame = 0
    this.waitingForServer = false

    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      vec2.create(),
      vec2.create(),
    )
    this.emitters = []
    this.emitterHistory = new Set()
    this.debugDrawRenderables = []
    this.debugDrawViewspace = []
    this.enableDebugDraw = true
    this.renderer = new Canvas3DRenderer(canvas)

    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()
    this.lastRenderAt = time.current()
    this.serverUpdateFrameDurationAvg = NaN
    this.serverSimulationDurationAvg = NaN

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.renderDurations = new RunningAverage(3 * 60)
    this.renderFrameDurations = new RunningAverage(3 * 60)
    this.framesAheadOfServer = new RunningAverage(3 * 60)
    this.serverInputsPerFrame = new RunningAverage(3 * 60)

    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        this.enableDebugDraw = !this.enableDebugDraw
      }
    })

    // Common
    this.state = GameState.Connecting
    this.nextState = undefined

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })

    // Depedency-injection binding
    this.registerParticleEmitter = this.registerParticleEmitter.bind(this)
  }

  setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  startPlay(): void {
    this.emitters = []

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)

    this.entityManager = new EntityManager([
      worldOrigin,
      vec2.add(
        vec2.create(),
        worldOrigin,
        vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE),
      ),
    ])
    this.entityManager.currentPlayer = this.playerNumber

    this.terrainLayer = initMap(this.entityManager, this.map)
    this.renderer.loadTerrain(this.terrainLayer.getRenderables())

    this.camera.minWorldPos = this.terrainLayer.minWorldPos()
    this.camera.worldDimensions = this.terrainLayer.dimensions()
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  update(): void {
    const start = time.current()
    this.updateFrameDurations.sample(start - this.lastUpdateAt)
    this.lastUpdateAt = start

    this.tick(SIMULATION_PERIOD_S)
    this.tickDurations.sample(time.current() - start)
  }

  tick(dt: number): void {
    let serverMessages: ServerMessage[] = []
    if (this.serverConnection) {
      serverMessages = this.serverConnection.consume()
    }

    if (this.nextState !== undefined) {
      this.state = this.nextState
      this.nextState = undefined

      switch (this.state) {
        case GameState.Running:
          this.startPlay()
          break
        case GameState.YouDied:
          this.currentLevel = 0
          break
        case GameState.LevelComplete:
          // this.currentLevel = (this.currentLevel + 1) % Object.keys(maps).length
          break
      }
    }

    switch (this.state) {
      case GameState.Connecting:
        {
          for (const msg of serverMessages) {
            if (msg.type === ServerMessageType.START_GAME) {
              this.playerNumber = msg.playerNumber
              this.setState(GameState.Running)
              break
            }
          }
        }
        break
      case GameState.Running:
        {
          // push frame updates from server into list
          for (const msg of serverMessages) {
            switch (msg.type) {
              case ServerMessageType.FRAME_UPDATE:
                {
                  this.serverFrameUpdates.push({
                    frame: msg.frame,
                    inputs: msg.inputs,
                  })

                  this.serverInputsPerFrame.sample(msg.inputs.length)
                  this.serverUpdateFrameDurationAvg = msg.updateFrameDurationAvg
                  this.serverSimulationDurationAvg = msg.simulationDurationAvg
                }
                break
            }
          }

          this.waitingForServer =
            this.serverFrameUpdates.length == 0 &&
            this.simulationFrame - this.committedFrame >= MAX_PREDICTED_FRAMES
          if (this.waitingForServer) {
            break
          }

          systems.syncServerState(this, dt, this.simulationFrame)
          this.framesAheadOfServer.sample(
            this.simulationFrame - this.committedFrame,
          )

          if (this.state === GameState.Running) {
            systems.playerInput(this, this.simulationFrame)
          }

          // We're unsure if we should increment the frame here;
          // turret shooting seems to indicate that it's actually
          // firing one frame early
          // this.simulationFrame++

          simulate(
            {
              entityManager: this.entityManager,
              messages: this.localMessageHistory.filter(
                (m) => m.frame === this.simulationFrame,
              ),
              terrainLayer: this.terrainLayer,
              frame: this.simulationFrame,
              registerParticleEmitter: this.registerParticleEmitter,
            },
            this.state,
            dt,
          )

          this.emitters = this.emitters.filter((e) => !e.dead)
          this.emitters.forEach((e) => e.update(dt))

          const playerId = this.entityManager.getPlayerId(this.playerNumber)
          if (playerId) {
            const transform = this.entityManager.transforms.get(playerId)!
            this.camera.setPosition(transform.position)
          }
          this.camera.update(dt)

          this.keyboard?.update()
          this.mouse?.update()

          // server message cleanup
          this.serverFrameUpdates = this.serverFrameUpdates.filter(
            (m) => m.frame <= this.simulationFrame,
          )

          this.serverConnection!.send({
            type: ClientMessageType.FRAME_END,
            frame: this.simulationFrame,
          })

          this.simulationFrame++
        }
        break
    }
  }

  render(): void {
    const now = time.current()
    this.renderFrameDurations.sample(now - this.lastRenderAt)
    this.lastRenderAt = now

    this.renderer.clear('magenta')

    this.renderer.setCameraWorldPos(this.camera.getPosition())
    this.renderer.renderTerrain()
    this.entityManager
      .getRenderables(this.camera.getVisibleExtents())
      .forEach((r) => this.renderer.render(r))
    this.emitters!.forEach((e) =>
      e.getRenderables().forEach((r) => this.renderer.render(r)),
    )

    systems.crosshair(this)

    if (this.enableDebugDraw) {
      this.debugDrawRenderables.forEach((r) => {
        this.renderer.render(r)
      })
    }
    this.debugDrawRenderables = []

    // Viewspace rendering
    return

    this.renderer.setTransform(mat2d.identity(mat2d.create()))

    systems.playerHealthBar(
      {
        entityManager: this.entityManager,
        playerNumber: this.playerNumber,
      },
      this.renderer,
    )
    // systems.inventoryDisplay(this, this.entityManager.getPlayer())

    if (this.state === GameState.YouDied) {
      this.renderer.render({
        primitive: Primitive.TEXT,
        text: 'YOU DIED',
        pos: vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
        hAlign: TextAlign.Center,
        vAlign: TextAlign.Center,
        font: '48px serif',
        style: 'red',
      })
    }

    if (this.state === GameState.LevelComplete) {
      this.renderer.render({
        primitive: Primitive.TEXT,
        text: 'YOU WIN',
        pos: vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
        hAlign: TextAlign.Center,
        vAlign: TextAlign.Center,
        font: '48px serif',
        style: 'black',
      })

      this.renderer.render({
        primitive: Primitive.TEXT,
        text: 'Press space to continue',
        pos: vec2.add(
          vec2.create(),
          vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
          vec2.fromValues(0, 50),
        ),
        hAlign: TextAlign.Center,
        vAlign: TextAlign.Center,
        font: '24px serif',
        style: 'black',
      })
    }

    this.debugDraw(() => {
      const res: Renderable[] = []

      for (const id of this.entityManager.walls) {
        const transform = this.entityManager.transforms.get(id)!
        res.push({
          primitive: Primitive.RECT,
          strokeStyle: 'cyan',
          pos: vec2.subtract(vec2.create(), transform.position, [
            TILE_SIZE / 2,
            TILE_SIZE / 2,
          ]),
          dimensions: [TILE_SIZE, TILE_SIZE],
        })
      }

      return res
    })

    this.debugDraw(
      () => {
        const text = [
          `Player ${this.playerNumber}`,
          `Render ms: ${(this.renderDurations.average() * 1000).toFixed(2)}`,
          `Render FPS: ${(1 / this.renderFrameDurations.average()).toFixed(2)}`,
          `Tick ms: ${(this.tickDurations.average() * 1000).toFixed(2)}`,
          `Update FPS: ${(1 / this.updateFrameDurations.average()).toFixed(2)}`,
          `FAOS: ${this.framesAheadOfServer.average().toFixed(2)}`,
          `SIPF: ${this.serverInputsPerFrame.average().toFixed(2)}`,
          `Server sim ms: ${(this.serverSimulationDurationAvg * 1000).toFixed(
            2,
          )}`,
          `Server update FPS: ${(1 / this.serverUpdateFrameDurationAvg).toFixed(
            2,
          )}`,
          this.waitingForServer ? 'WAITING FOR SERVER' : '',
        ]

        const x = this.camera.viewportDimensions[0] - 10
        let y = 10
        const res: Renderable[] = []
        for (const t of text) {
          res.push({
            primitive: Primitive.TEXT,
            text: t,
            pos: vec2.fromValues(x, y),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          })
          y += 20
        }

        return res
      },
      { viewspace: true },
    )

    if (this.enableDebugDraw) {
      this.debugDrawViewspace.forEach((r) => {
        this.renderer.render(r)
      })
    }

    this.debugDrawViewspace = []

    this.renderDurations.sample(time.current() - now)
  }

  registerParticleEmitter(params: {
    emitter: ParticleEmitter
    entity: EntityId
    frame: number
  }): void {
    if (!this.emitterHistory.has(`${params.frame}:${params.entity}`)) {
      this.emitterHistory.add(`${params.frame}:${params.entity}`)
      this.emitters.push(params.emitter)
    }
  }

  debugDraw(
    makeRenderables: () => Renderable[],
    options: { viewspace?: boolean } = {},
  ): void {
    if (!this.enableDebugDraw) {
      return
    }

    if (options.viewspace) {
      this.debugDrawViewspace = this.debugDrawViewspace.concat(
        makeRenderables(),
      )
    } else {
      this.debugDrawRenderables = this.debugDrawRenderables.concat(
        makeRenderables(),
      )
    }
  }

  sendClientMessage(m: ClientMessage): void {
    this.localMessageHistory.push(m)
    this.serverConnection!.send(m)
  }
}
