import { mat2d, vec2 } from 'gl-matrix'

import { EntityId } from './entities/EntityId'

import { Camera } from '~/Camera'
import { SIMULATION_PERIOD_S, TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression, initMap } from '~/Game'
import { IKeyboard } from '~/Keyboard'
import { Map } from '~/map/interfaces'
import { Mouse } from '~/Mouse'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Canvas2DRenderer } from '~/renderer/Canvas2DRenderer'
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
  ticksPerUpdate: number
  updatePeriod: number

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

  tickDurations: RunningAverage
  updateDurations: RunningAverage
  renderFrameDurations: RunningAverage
  framesAheadOfServer: RunningAverage
  serverInputsPerFrame: RunningAverage

  keyboard?: IKeyboard
  mouse?: Mouse

  // Common game state
  state: GameState
  nextState: GameState | null

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
    this.ticksPerUpdate = 1
    this.updatePeriod = SIMULATION_PERIOD_S * 1000

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
    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)
    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()
    this.lastRenderAt = time.current()

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateDurations = new RunningAverage(3 * 60)
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
    this.nextState = null

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

    this.terrainLayer = initMap(this.entityManager, this.map)

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
    const now = time.current()
    this.updateDurations.sample(now - this.lastUpdateAt)
    this.lastUpdateAt = now

    // schedule next update before we run potentially expensive game sim
    setTimeout(() => this.update(), this.updatePeriod)

    for (let i = 0; i < this.ticksPerUpdate; i++) {
      this.tick(SIMULATION_PERIOD_S)
    }
  }

  tick(dt: number): void {
    const now = time.current()
    this.tickDurations.sample(now - this.lastTickAt)
    this.lastTickAt = now

    let serverMessages: ServerMessage[] = []
    if (this.serverConnection) {
      serverMessages = this.serverConnection.consume()
    }

    if (this.nextState) {
      this.state = this.nextState
      this.nextState = null

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
                }
                break
              case ServerMessageType.SPEED_UP:
                this.ticksPerUpdate = 2
                this.updatePeriod = (1000 * SIMULATION_PERIOD_S) / 2
                break
              case ServerMessageType.SLOW_DOWN:
                this.ticksPerUpdate = 1
                this.updatePeriod = 1000 * SIMULATION_PERIOD_S
                break
            }
          }

          systems.syncServerState(this, dt, this.simulationFrame)
          this.framesAheadOfServer.sample(
            this.simulationFrame - this.committedFrame,
          )

          if (this.state === GameState.Running) {
            systems.playerInput(this, this.simulationFrame)
          }

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

          const player = this.entityManager.getPlayer(this.playerNumber)
          if (player) {
            this.camera.setPosition(player.transform!.position)
          }
          this.camera.update(dt)

          this.keyboard?.update()
          this.mouse?.update()

          // server message cleanup
          this.serverFrameUpdates = this.serverFrameUpdates.filter(
            (m) => m.frame <= this.simulationFrame,
          )

          this.simulationFrame++
        }
        break
    }

    if (this.serverConnection) {
      this.serverConnection.send({
        type: ClientMessageType.FRAME_END,
        frame: this.simulationFrame,
      })
    }
  }

  render(): void {
    const now = time.current()
    this.renderFrameDurations.sample(now - this.lastRenderAt)
    this.lastRenderAt = now

    this.renderer.clear('magenta')

    this.renderer.setTransform(this.camera.wvTransform())

    this.terrainLayer
      .getRenderables(this.camera.getVisibleExtents())
      .forEach((r) => this.renderer.render(r))
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
        const rightEdge = this.camera.viewportDimensions[0]
        return [
          {
            primitive: Primitive.TEXT,
            text: `Player ${this.playerNumber}`,
            pos: vec2.fromValues(rightEdge - 10, 10),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: `Render FPS: ${(
              1 / this.renderFrameDurations.average()
            ).toFixed(2)}`,
            pos: vec2.fromValues(rightEdge - 10, 30),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: `Update FPS: ${(1 / this.updateDurations.average()).toFixed(
              2,
            )}`,
            pos: vec2.fromValues(rightEdge - 10, 50),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: `Tick FPS: ${(1 / this.tickDurations.average()).toFixed(2)}`,
            pos: vec2.fromValues(rightEdge - 10, 70),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: `FAOS: ${this.framesAheadOfServer.average().toFixed(2)}`,
            pos: vec2.fromValues(rightEdge - 10, 90),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: `SIPF: ${this.serverInputsPerFrame.average().toFixed(2)}`,
            pos: vec2.fromValues(rightEdge - 10, 110),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
          {
            primitive: Primitive.TEXT,
            text: this.ticksPerUpdate > 1 ? `OVERDRIVE` : '',
            pos: vec2.fromValues(rightEdge - 10, 150),
            hAlign: TextAlign.Max,
            vAlign: TextAlign.Center,
            font: '36px monospace',
            style: 'red',
          },
        ]
      },
      { viewspace: true },
    )

    if (this.enableDebugDraw) {
      this.debugDrawViewspace.forEach((r) => {
        this.renderer.render(r)
      })
    }

    this.debugDrawViewspace = []
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
