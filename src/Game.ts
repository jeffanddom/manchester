import { mat2d, vec2 } from 'gl-matrix'

import { maps } from '~/assets/maps'
import { Camera } from '~/Camera'
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
import * as systems from '~/systems'
import * as terrain from '~/terrain'
import { None, Option, Some } from '~/util/Option'

export enum GameState {
  None,
  Running,
  YouDied,
  LevelComplete,
}

const gameProgression = [maps.collisionTest, maps.bigMap]

export class Game implements Game {
  state: GameState
  nextState: Option<GameState>

  currentLevel: number

  renderer: IRenderer

  enableDebugDraw: boolean
  debugDrawRenderables: Renderable[]

  map: Map
  terrainLayer: terrain.Layer
  entities: EntityManager
  emitters: ParticleEmitter[]

  keyboard: Keyboard
  mouse: Mouse

  player: Option<Entity>
  camera: Camera

  constructor(canvas: HTMLCanvasElement) {
    this.state = GameState.None
    this.nextState = None()

    this.currentLevel = 0
    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)

    this.enableDebugDraw = false
    this.debugDrawRenderables = []

    this.entities = new EntityManager()
    this.emitters = []

    this.keyboard = new Keyboard()
    this.mouse = new Mouse(canvas)

    this.player = None()
    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })
    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      vec2.create(),
      vec2.create(),
    )

    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        this.enableDebugDraw = !this.enableDebugDraw
      }
    })
  }

  setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  startPlay(): void {
    this.entities = new EntityManager()
    this.emitters = []
    this.player = None()

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    this.terrainLayer = new terrain.Layer({
      tileOrigin: this.map.origin,
      tileDimensions: this.map.dimensions,
      terrain: this.map.terrain,
    })
    this.camera.minWorldPos = this.terrainLayer.minWorldPos()
    this.camera.worldDimensions = this.terrainLayer.dimensions()

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

        this.entities.register(entity)

        if (et === entities.types.Type.PLAYER) {
          this.player = Some(entity)
        }
      }
    }
  }

  setState(s: GameState): void {
    this.nextState = Some(s)
  }

  update(dt: number): void {
    this.nextState.map((nextState) => {
      this.state = nextState
      this.nextState = None()

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
    })

    systems.transformInit(this)
    systems.motion(this, dt)

    if (this.state === GameState.Running) {
      systems.playerMover(this, dt)
      systems.builder(this, dt)
      systems.shooter(this, dt)
      systems.turret(this, dt)
    }

    systems.pickups(this)
    systems.wallCollider(this)
    systems.attack(this)
    systems.damageable(this)
    systems.playfieldClamping(this)

    if (this.state === GameState.YouDied) {
      // 'r' for restart
      if (this.keyboard.upKeys.has(82)) {
        this.setState(GameState.Running)
      }
    }

    if (this.state === GameState.Running) {
      systems.levelCompletion(this)
    }

    if (this.state === GameState.LevelComplete) {
      if (this.keyboard.upKeys.has(32)) {
        this.setState(GameState.Running)
      }
    }

    systems.prerender(this)

    this.entities.update() // entity cleanup

    this.emitters = this.emitters.filter((e) => !e.dead)
    this.emitters.forEach((e) => e.update(dt))

    this.player.map((p) => {
      this.camera.setPosition(p.transform!.position)
    })
    this.camera.update(dt)

    this.keyboard.update()
    this.mouse.update()
  }

  render(): void {
    this.renderer.clear('magenta')

    this.renderer.setTransform(this.camera.wvTransform())

    this.terrainLayer
      .getRenderables(this.camera.getVisibleExtents())
      .forEach((r) => this.renderer.render(r))
    this.entities.getRenderables().forEach((r) => this.renderer.render(r))
    this.emitters!.forEach((e) =>
      e.getRenderables().forEach((r) => this.renderer.render(r)),
    )

    // CURSOR
    // FIXME: this should be a renderable/entity
    this.mouse.getPos().map((pos) => {
      const topLeft = vec2.sub(
        vec2.create(),
        this.camera.viewToWorldspace(pos),
        vec2.fromValues(3, 3),
      )
      const d = vec2.fromValues(6, 6)
      this.renderer.render({
        primitive: Primitive.RECT,
        strokeStyle: 'black',
        fillStyle: 'white',
        pos: topLeft,
        dimensions: d,
      })
    })

    if (this.enableDebugDraw) {
      this.debugDrawRenderables.forEach((r) => {
        this.renderer.render(r)
      })
    }
    this.debugDrawRenderables = []

    // Viewspace rendering

    this.renderer.setTransform(mat2d.identity(mat2d.create()))

    systems.playerHealthBar(this)

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
}
