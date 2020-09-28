import { mat2d, vec2 } from 'gl-matrix'

import { ServerMessage, ServerMessageType } from './network/ServerMessage'

import { Camera } from '~/Camera'
import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { IKeyboard } from '~/Keyboard'
import { Map } from '~/map/interfaces'
import { Mouse } from '~/Mouse'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
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

  camera: Camera
  debugDrawRenderables: Renderable[]
  debugDrawViewspace: Renderable[]
  emitters: ParticleEmitter[]
  emitterHistory: Set<string>
  enableDebugDraw: boolean
  renderer: IRenderer
  lastUpdateAt: number
  lastRenderAt: number

  updateFrameDurations: RunningAverage
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
    this.entityManager = new EntityManager()
    this.localMessageHistory = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverConnection = null
    this.playerNumber = -1
    this.serverFrameUpdates = []
    this.committedFrame = -1

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
    this.lastRenderAt = time.current()

    this.updateFrameDurations = new RunningAverage(3 * 60)
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
    this.entityManager = new EntityManager()
    this.emitters = []

    // Level setup
    const mapData = initMap(this.entityManager, this.currentLevel)
    this.map = mapData.map
    this.terrainLayer = mapData.terrainLayer

    this.camera.minWorldPos = this.terrainLayer.minWorldPos()
    this.camera.worldDimensions = this.terrainLayer.dimensions()
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  update(dt: number, frame: number): void {
    const now = time.current()
    this.updateFrameDurations.sample(now - this.lastUpdateAt)
    this.lastUpdateAt = now

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
      default:
        {
          // push frame updates from server into list
          for (const msg of serverMessages) {
            if (msg.type === ServerMessageType.FRAME_UPDATE) {
              this.serverFrameUpdates.push({
                frame: msg.frame,
                inputs: msg.inputs,
              })

              this.serverInputsPerFrame.sample(msg.inputs.length)
            }
          }

          systems.syncServerState(this, dt, frame)
          this.framesAheadOfServer.sample(frame - this.committedFrame)

          if (this.state === GameState.Running) {
            systems.playerInput(this, frame)
          }

          simulate(
            {
              entityManager: this.entityManager,
              messages: this.localMessageHistory.filter(
                (m) => m.frame === frame,
              ),
              terrainLayer: this.terrainLayer,
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
            (m) => m.frame <= frame,
          )
        }
        break
    }

    if (this.serverConnection) {
      this.serverConnection.send({
        type: ClientMessageType.FRAME_END,
        frame,
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
    this.entityManager.getRenderables().forEach((r) => this.renderer.render(r))
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

    // systems.playerHealthBar(this)
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
      return Object.values(this.entityManager.entities)
        .filter((e) => e.wall)
        .map((e) => ({
          primitive: Primitive.RECT,
          strokeStyle: 'cyan',
          pos: vec2.subtract(vec2.create(), e.transform!.position, [
            TILE_SIZE / 2,
            TILE_SIZE / 2,
          ]),
          dimensions: [TILE_SIZE, TILE_SIZE],
        }))
    })

    this.debugDraw(
      () => [
        {
          primitive: Primitive.TEXT,
          text: `Player ${this.playerNumber}`,
          pos: vec2.fromValues(10, 10),
          hAlign: TextAlign.Min,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        },
        {
          primitive: Primitive.TEXT,
          text: `Render FPS: ${(
            1 / this.renderFrameDurations.average()
          ).toFixed(2)}`,
          pos: vec2.fromValues(10, 30),
          hAlign: TextAlign.Min,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        },
        {
          primitive: Primitive.TEXT,
          text: `Update FPS: ${(
            1 / this.updateFrameDurations.average()
          ).toFixed(2)}`,
          pos: vec2.fromValues(10, 50),
          hAlign: TextAlign.Min,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        },
        {
          primitive: Primitive.TEXT,
          text: `FAOS: ${(1 / this.framesAheadOfServer.average()).toFixed(2)}`,
          pos: vec2.fromValues(10, 70),
          hAlign: TextAlign.Min,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        },
        {
          primitive: Primitive.TEXT,
          text: `SIPF: ${(1 / this.serverInputsPerFrame.average()).toFixed(2)}`,
          pos: vec2.fromValues(10, 90),
          hAlign: TextAlign.Min,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        },
      ],
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
    frame: number
    entity: string
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
