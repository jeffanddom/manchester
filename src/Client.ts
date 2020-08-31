import { mat2d, vec2 } from 'gl-matrix'

import { Camera } from '~/Camera'
import { ClientMessage } from '~/ClientMessage'
import { Entity } from '~/entities/Entity'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression } from '~/Game'
import { Keyboard } from '~/Keyboard'
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
import * as systems from '~/systems'
import { CursorMode } from '~/systems/client/playerInput'
import * as terrain from '~/terrain'

export class Client {
  entityManager: EntityManager
  messageBuffer: ClientMessage[]
  playerInputState: {
    cursorMode: CursorMode
  }
  serverMessages: ServerMessage[]
  serverSnapshot: {
    frame: number
    entities: { [key: string]: Entity }
  }

  camera: Camera
  debugDrawRenderables: Renderable[]
  emitters: ParticleEmitter[]
  enableDebugDraw: boolean
  renderer: IRenderer

  keyboard?: Keyboard
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
    this.messageBuffer = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverMessages = []
    this.serverSnapshot = {
      frame: -1,
      entities: {},
    }

    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      vec2.create(),
      vec2.create(),
    )
    this.emitters = []
    this.debugDrawRenderables = []
    this.enableDebugDraw = false
    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)

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
    this.emitters = []

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    this.terrainLayer = new terrain.Layer({
      tileOrigin: this.map.origin,
      tileDimensions: this.map.dimensions,
      terrain: this.map.terrain,
    })
    this.camera.minWorldPos = this.terrainLayer.minWorldPos()
    this.camera.worldDimensions = this.terrainLayer.dimensions()
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  connect(server: Server): void {
    this.server = server
    this.server.clients.push(this)
  }

  update(dt: number, frame: number): void {
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
          this.currentLevel = (this.currentLevel + 1) % Object.keys(maps).length
          break
      }
    }

    systems.syncServerState(this, frame)

    if (this.state === GameState.Running) {
      systems.playerInput(this, this.entityManager, frame)

      // predictive simulation
      systems.tankMover(
        {
          entityManager: this.entityManager,
          messages: this.messageBuffer.filter((m) => m.frame === frame),
        },
        dt,
        frame,
      )
    }

    this.emitters = this.emitters.filter((e) => !e.dead)
    this.emitters.forEach((e) => e.update(dt))

    if (this.entityManager.getPlayer()) {
      this.camera.setPosition(
        this.entityManager.getPlayer()!.transform!.position,
      )
    }
    this.camera.update(dt)

    this.keyboard?.update()
    this.mouse?.update()

    // server message cleanup
    this.serverMessages = this.serverMessages.filter((m) => m.frame <= frame)
  }

  render(): void {
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
  }

  debugDraw(makeRenderables: () => Renderable[]): void {
    if (!this.enableDebugDraw) {
      return
    }

    this.debugDrawRenderables = this.debugDrawRenderables.concat(
      makeRenderables(),
    )
  }

  sendClientMessage(m: ClientMessage): void {
    this.messageBuffer.push(m)
    this.server!.clientMessages.push(m)
  }
}
