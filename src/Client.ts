import { vec2 } from 'gl-matrix'
import { mat2d } from 'gl-matrix'

import { Renderer2d } from './renderer/Renderer2d'

import { Camera } from '~/Camera'
import {
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/constants'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression, initMap } from '~/Game'
import { IKeyboard } from '~/input/Keyboard'
import { Mouse } from '~/input/Mouse'
import { Map } from '~/map/interfaces'
import { getModel, loadGrid } from '~/models'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive2d, Renderable2d, TextAlign } from '~/renderer/interfaces'
import { Renderer3d } from '~/renderer/Renderer3d'
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
  debugDraw2dRenderables: Renderable2d[]
  emitters: ParticleEmitter[]
  emitterHistory: Set<string>
  enableDebugDraw: boolean
  renderer3d: Renderer3d
  renderer2d: Renderer2d
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

  constructor(config: {
    canvas3d: HTMLCanvasElement
    canvas2d: HTMLCanvasElement
  }) {
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
      vec2.fromValues(config.canvas3d.width, config.canvas3d.height),
      vec2.create(),
      vec2.create(),
    )
    this.emitters = []
    this.emitterHistory = new Set()
    this.debugDraw2dRenderables = []
    this.enableDebugDraw = true
    this.renderer3d = new Renderer3d(config.canvas3d)
    this.renderer2d = new Renderer2d(config.canvas2d)

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
    this.renderer3d.setViewportDimensions(d)
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
    this.renderer3d.loadModel('terrain', this.terrainLayer.getModel())

    const gridModel = loadGrid()
    this.renderer3d.loadModel('grid', gridModel)

    const wallModel = getModel('wall')
    this.renderer3d.loadModel('wall', wallModel)

    const tankModel = getModel('tank')
    this.renderer3d.loadModel('tank', tankModel)

    const turretModel = getModel('turret')
    this.renderer3d.loadModel('turret', turretModel)

    const treeModel = getModel('tree')
    this.renderer3d.loadModel('tree', treeModel)

    const bulletModel = getModel('bullet')
    this.renderer3d.loadModel('bullet', bulletModel)

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

    this.renderer3d.clear('magenta')

    this.renderer3d.setCameraWorldPos(this.camera.getPosition())
    this.renderer3d.drawModel('terrain', vec2.create(), 0)

    // GRID DEBUG
    this.renderer3d.drawModel('grid', vec2.create(), 0)

    for (const [entityId, model] of this.entityManager.renderables) {
      const transform = this.entityManager.transforms.get(entityId)!

      this.renderer3d.drawModel(
        model,
        transform.position,
        transform.orientation,
      )
    }

    // this.emitters!.forEach((e) =>
    //   e.getRenderables().forEach((r) => this.renderer.render(r)),
    // )

    // systems.crosshair(this)

    // if (this.enableDebugDraw) {
    //   this.debugDrawRenderables.forEach((r) => {
    //     this.renderer.render(r)
    //   })
    // }
    // this.debugDrawRenderables = []

    // Viewspace rendering

    this.renderer2d.clear()
    this.renderer2d.setTransform(mat2d.identity(mat2d.create()))

    // systems.playerHealthBar(
    //   {
    //     entityManager: this.entityManager,
    //     playerNumber: this.playerNumber,
    //   },
    //   this.renderer,
    // )
    // // systems.inventoryDisplay(this, this.entityManager.getPlayer())

    // if (this.state === GameState.YouDied) {
    //   this.renderer.render({
    //     primitive: Primitive.TEXT,
    //     text: 'YOU DIED',
    //     pos: vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
    //     hAlign: TextAlign.Center,
    //     vAlign: TextAlign.Center,
    //     font: '48px serif',
    //     style: 'red',
    //   })
    // }

    // if (this.state === GameState.LevelComplete) {
    //   this.renderer.render({
    //     primitive: Primitive.TEXT,
    //     text: 'YOU WIN',
    //     pos: vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
    //     hAlign: TextAlign.Center,
    //     vAlign: TextAlign.Center,
    //     font: '48px serif',
    //     style: 'black',
    //   })

    //   this.renderer.render({
    //     primitive: Primitive.TEXT,
    //     text: 'Press space to continue',
    //     pos: vec2.add(
    //       vec2.create(),
    //       vec2.scale(vec2.create(), this.camera.viewportDimensions, 0.5),
    //       vec2.fromValues(0, 50),
    //     ),
    //     hAlign: TextAlign.Center,
    //     vAlign: TextAlign.Center,
    //     font: '24px serif',
    //     style: 'black',
    //   })
    // }

    this.debugDraw2d(() => {
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
      const res: Renderable2d[] = []
      for (const t of text) {
        res.push({
          primitive: Primitive2d.TEXT,
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
    })

    if (this.enableDebugDraw) {
      this.debugDraw2dRenderables.forEach((r) => {
        this.renderer2d.render(r)
      })
    }

    this.debugDraw2dRenderables = []

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

  debugDraw2d(makeRenderables: () => Renderable2d[]): void {
    if (!this.enableDebugDraw) {
      return
    }

    this.debugDraw2dRenderables = this.debugDraw2dRenderables.concat(
      makeRenderables(),
    )
  }

  sendClientMessage(m: ClientMessage): void {
    this.localMessageHistory.push(m)
    this.serverConnection!.send(m)
  }
}
