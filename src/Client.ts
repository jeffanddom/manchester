import { mat2d, vec2 } from 'gl-matrix'

import { Camera } from '~/Camera'
import { ClientMessage } from '~/ClientMessage'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { IKeyboard } from '~/Keyboard'
import { Map } from '~/map/interfaces'
import { Mouse } from '~/Mouse'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Canvas2DRenderer } from '~/renderer/Canvas2DRenderer'
import {
  IRenderer,
  Primitive,
  Renderable,
  TextAlign,
} from '~/renderer/interfaces'
import { Server } from '~/Server'
import { ServerMessage } from '~/ServerMessage'
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
  playerNumber: number
  serverMessages: ServerMessage[]
  serverFrame: number

  camera: Camera
  debugDrawRenderables: Renderable[]
  debugDrawViewspace: Renderable[]
  emitters: ParticleEmitter[]
  enableDebugDraw: boolean
  renderer: IRenderer
  lastUpdateAt: number
  lastRenderAt: number
  updateFrameDurations: RunningAverage
  renderFrameDurations: RunningAverage

  keyboard?: IKeyboard
  mouse?: Mouse
  server?: Server

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
    this.playerNumber = -1
    this.serverMessages = []
    this.serverFrame = -1

    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      vec2.create(),
      vec2.create(),
    )
    this.emitters = []
    this.debugDrawRenderables = []
    this.debugDrawViewspace = []
    this.enableDebugDraw = true
    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)
    this.lastUpdateAt = time.current()
    this.lastRenderAt = time.current()
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.renderFrameDurations = new RunningAverage(3 * 60)

    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        this.enableDebugDraw = !this.enableDebugDraw
      }
    })

    // Common
    this.state = GameState.None
    this.nextState = null

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })
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

  connect(server: Server): void {
    this.server = server
    this.playerNumber = this.server.clients.push(this)
  }

  update(dt: number, frame: number): void {
    const now = time.current()
    this.updateFrameDurations.sample(now - this.lastUpdateAt)
    this.lastUpdateAt = now

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

    systems.syncServerState(this, dt, frame)

    if (this.state === GameState.Running) {
      systems.playerInput(this, frame)
    }

    simulate(
      {
        entityManager: this.entityManager,
        messages: this.localMessageHistory.filter((m) => m.frame === frame),
        terrainLayer: this.terrainLayer,
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
    this.serverMessages = this.serverMessages.filter((m) => m.frame <= frame)
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

    if (this.enableDebugDraw) {
      this.debugDraw(
        () => [
          {
            primitive: Primitive.TEXT,
            text: `Render FPS: ${(
              1 / this.renderFrameDurations.average()
            ).toFixed(2)}\n`,
            pos: vec2.fromValues(10, 10),
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
            pos: vec2.fromValues(10, 30),
            hAlign: TextAlign.Min,
            vAlign: TextAlign.Center,
            font: '16px monospace',
            style: 'cyan',
          },
        ],
        { viewspace: true },
      )

      this.debugDrawViewspace.forEach((r) => {
        this.renderer.render(r)
      })
    }
    this.debugDrawViewspace = []
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
    this.server!.clientMessages.push(m)
  }
}
