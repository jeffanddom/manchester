import { vec2 } from 'gl-matrix'

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
import { IRenderer, Primitive, Renderable } from '~/renderer/interfaces'
import * as systems from '~/systems'
import * as terrain from '~/terrain'
import { None, Option, Some } from '~/util/Option'

export enum GameState {
  None,
  Running,
  YouDied,
}

export class Game implements Game {
  state: GameState
  nextState: Option<GameState>
  map: Map

  renderer: IRenderer

  enableDebugDraw: boolean
  debugDrawRenderables: Renderable[]

  terrain: terrain.Layer
  entities: EntityManager
  emitters: ParticleEmitter[]

  keyboard: Keyboard
  mouse: Mouse

  player: Option<Entity>
  camera: Camera

  constructor(canvas: HTMLCanvasElement, map: Map) {
    this.state = GameState.None
    this.nextState = None()
    this.map = map

    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)

    this.enableDebugDraw = false
    this.debugDrawRenderables = []

    this.terrain = new terrain.Layer({
      tileOrigin: map.origin,
      tileDimensions: map.dimensions,
      terrain: map.terrain,
    })
    this.entities = new EntityManager()
    this.emitters = []

    this.keyboard = new Keyboard()
    this.mouse = new Mouse(canvas)

    this.player = None()
    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      this.terrain.minWorldPos(),
      this.terrain.dimensions(),
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
            this.terrain.minWorldPos(),
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
      }
    })

    systems.transformInit(this)
    systems.motion(this, dt)
    systems.wallCollider(this)

    if (this.state === GameState.Running) {
      systems.shooter(this, dt)
    }

    systems.damager(this)
    systems.damageable(this)
    systems.playfieldClamping(this)

    if (this.state === GameState.YouDied) {
      // 'r' for restart
      if (this.keyboard.upKeys.has(82)) {
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
  }

  render(): void {
    this.renderer.clear('magenta')

    this.renderer.setTransform(this.camera.wvTransform())

    this.terrain
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

    systems.playerHealthBar(this)

    if (this.state === GameState.YouDied) {
      this.renderer.render({
        primitive: Primitive.TEXT,
        text: 'YOU DIED',
        pos: vec2.fromValues(100, 100),
        font: '48px serif',
        style: 'red',
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
