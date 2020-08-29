import { mat2d, vec2 } from 'gl-matrix'

import { convertToServerMessage } from './util/entities'

import { maps } from '~/assets/maps'
import { Camera } from '~/Camera'
import { ClientMessage } from '~/ClientMessage'
import { TILE_SIZE } from '~/constants'
import * as entities from '~/entities'
import { Entity } from '~/entities/Entity'
import { EntityManager } from '~/entities/EntityManager'
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
import { ServerMessage } from '~/ServerMessage'
import * as systems from '~/systems'
import { CursorMode } from '~/systems/playerInput'
import * as terrain from '~/terrain'

export enum GameState {
  None,
  Running,
  YouDied,
  LevelComplete,
}

const gameProgression = [maps.collisionTest, maps.bigMap]

export class Game implements Game {
  // Client data
  client: {
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

    keyboard: Keyboard
    mouse: Mouse
  }

  // Server data
  server: {
    clientMessages: ClientMessage[]
    entityManager: EntityManager
  }

  // Shared data (should be nothing eventually...)
  state: GameState
  nextState: GameState | null

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  player: Entity | null

  constructor(canvas: HTMLCanvasElement) {
    this.client = {
      entityManager: new EntityManager(),
      messageBuffer: [],
      playerInputState: { cursorMode: CursorMode.NONE },
      serverMessages: [],
      serverSnapshot: {
        frame: -1,
        entities: {},
      },

      camera: new Camera(
        vec2.fromValues(canvas.width, canvas.height),
        vec2.create(),
        vec2.create(),
      ),
      emitters: [],
      debugDrawRenderables: [],
      enableDebugDraw: false,
      renderer: new Canvas2DRenderer(canvas.getContext('2d')!),

      keyboard: new Keyboard(),
      mouse: new Mouse(canvas),
    }

    this.server = {
      clientMessages: [],
      entityManager: new EntityManager(),
    }

    this.state = GameState.None
    this.nextState = null

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })

    this.player = null
    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        this.client.enableDebugDraw = !this.client.enableDebugDraw
      }
    })
  }

  setViewportDimensions(d: vec2): void {
    this.client.camera.setViewportDimensions(d)
  }

  startPlay(): void {
    this.server.entityManager = new EntityManager()
    this.client.emitters = []
    this.player = null

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    this.terrainLayer = new terrain.Layer({
      tileOrigin: this.map.origin,
      tileDimensions: this.map.dimensions,
      terrain: this.map.terrain,
    })
    this.client.camera.minWorldPos = this.terrainLayer.minWorldPos()
    this.client.camera.worldDimensions = this.terrainLayer.dimensions()

    // Populate entities
    for (let i = 0; i < this.map.dimensions[1]; i++) {
      for (let j = 0; j < this.map.dimensions[0]; j++) {
        const et = this.map.entities[i * this.map.dimensions[0] + j]
        if (et === null) {
          continue
        }

        const entity = entities.types.make(et)
        if (entity.transform !== undefined) {
          entity.transform.position = vec2.add(
            vec2.create(),
            this.terrainLayer.minWorldPos(),
            vec2.fromValues(
              j * TILE_SIZE + TILE_SIZE * 0.5,
              i * TILE_SIZE + TILE_SIZE * 0.5,
            ),
          )
        }

        this.server.entityManager.register(entity)

        if (et === entities.types.Type.PLAYER) {
          this.player = entity
        }
      }
    }
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  sendClientMessage(m: ClientMessage): void {
    this.client.messageBuffer.push(m)
    this.server.clientMessages.push(m)
  }

  clientUpdate(dt: number, frame: number): void {
    systems.syncServerState(this, frame)

    if (this.state === GameState.Running) {
      systems.playerInput(this, frame)

      // predictive simulation
      systems.tankMover(
        {
          entityManager: this.client.entityManager,
          messages: this.client.messageBuffer.filter((m) => m.frame === frame),
        },
        dt,
        frame,
      )
    }

    this.client.emitters = this.client.emitters.filter((e) => !e.dead)
    this.client.emitters.forEach((e) => e.update(dt))

    if (this.client.entityManager.getPlayer()) {
      this.client.camera.setPosition(
        this.client.entityManager.getPlayer()!.transform!.position,
      )
    }
    this.client.camera.update(dt)

    this.client.keyboard.update()
    this.client.mouse.update()

    // server message cleanup
    this.client.serverMessages = this.client.serverMessages.filter(
      (m) => m.frame <= frame,
    )
  }

  serverUpdate(dt: number, frame: number): void {
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

    systems.transformInit(this)

    if (this.state === GameState.Running) {
      systems.tankMover(
        {
          entityManager: this.server.entityManager,
          messages: this.server.clientMessages,
        },
        dt,
        frame,
      )
      // systems.hiding(this)
      // systems.builder(this, dt)
      // systems.shooter(this, dt)
      // systems.turret(this, dt)
    }

    // systems.bullet(this, dt)
    // systems.pickups(this)
    // systems.wallCollider(this)
    // systems.attack(this)
    // systems.playfieldClamping(this)

    // systems.damageable(this)

    // FIXME: this should be a client event
    if (this.state === GameState.YouDied) {
      // 'r' for restart
      if (this.client.keyboard.upKeys.has(82)) {
        this.setState(GameState.Running)
      }
    }

    if (this.state === GameState.Running) {
      systems.levelCompletion(this)
    }

    if (this.state === GameState.LevelComplete) {
      if (this.client.keyboard.upKeys.has(32)) {
        this.setState(GameState.Running)
      }
    }

    this.server.entityManager.update() // entity cleanup

    // client message cleanup
    this.server.clientMessages = this.server.clientMessages.filter(
      (m) => m.frame > frame,
    )

    // Enqueue server state for the client
    const serverMessage = {
      frame,
      entities: convertToServerMessage(this.server.entityManager.entities),
    }
    this.client.serverMessages.push(serverMessage)
  }

  render(): void {
    this.client.renderer.clear('magenta')

    this.client.renderer.setTransform(this.client.camera.wvTransform())

    this.terrainLayer
      .getRenderables(this.client.camera.getVisibleExtents())
      .forEach((r) => this.client.renderer.render(r))
    this.client.entityManager
      .getRenderables()
      .forEach((r) => this.client.renderer.render(r))
    this.client.emitters!.forEach((e) =>
      e.getRenderables().forEach((r) => this.client.renderer.render(r)),
    )

    systems.crosshair(this)

    if (this.client.enableDebugDraw) {
      this.client.debugDrawRenderables.forEach((r) => {
        this.client.renderer.render(r)
      })
    }
    this.client.debugDrawRenderables = []

    // Viewspace rendering

    this.client.renderer.setTransform(mat2d.identity(mat2d.create()))

    // systems.playerHealthBar(this)
    // systems.inventoryDisplay(this)

    if (this.state === GameState.YouDied) {
      this.client.renderer.render({
        primitive: Primitive.TEXT,
        text: 'YOU DIED',
        pos: vec2.scale(
          vec2.create(),
          this.client.camera.viewportDimensions,
          0.5,
        ),
        hAlign: TextAlign.Center,
        vAlign: TextAlign.Center,
        font: '48px serif',
        style: 'red',
      })
    }

    if (this.state === GameState.LevelComplete) {
      this.client.renderer.render({
        primitive: Primitive.TEXT,
        text: 'YOU WIN',
        pos: vec2.scale(
          vec2.create(),
          this.client.camera.viewportDimensions,
          0.5,
        ),
        hAlign: TextAlign.Center,
        vAlign: TextAlign.Center,
        font: '48px serif',
        style: 'black',
      })

      this.client.renderer.render({
        primitive: Primitive.TEXT,
        text: 'Press space to continue',
        pos: vec2.add(
          vec2.create(),
          vec2.scale(vec2.create(), this.client.camera.viewportDimensions, 0.5),
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
    if (!this.client.enableDebugDraw) {
      return
    }

    this.client.debugDrawRenderables = this.client.debugDrawRenderables.concat(
      makeRenderables(),
    )
  }
}
