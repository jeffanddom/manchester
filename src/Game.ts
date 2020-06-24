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
import { IRenderer, Primitive } from '~/renderer/interfaces'
import * as terrain from '~/terrain'
import { None, Option, Some } from '~/util/Option'

let DEBUG_MODE = false

export class Game implements Game {
  renderer: IRenderer

  terrain: terrain.Layer
  entities: EntityManager
  keyboard: Keyboard
  mouse: Mouse
  emitters: ParticleEmitter[]

  player: Option<Entity>
  camera: Camera

  constructor(canvas: HTMLCanvasElement, map: Map) {
    this.renderer = new Canvas2DRenderer(canvas.getContext('2d')!)
    this.terrain = new terrain.Layer({
      tileOrigin: map.origin,
      tileDimensions: map.dimensions,
      terrain: map.terrain,
    })
    this.entities = new EntityManager()
    this.keyboard = new Keyboard()
    this.mouse = new Mouse(canvas)
    this.emitters = []

    this.camera = new Camera(
      vec2.fromValues(canvas.width, canvas.height),
      this.terrain.minWorldPos(),
      this.terrain.dimensions(),
    )
    this.player = None()

    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        DEBUG_MODE = !DEBUG_MODE
      }
    })

    // Populate entities
    for (let i = 0; i < map.dimensions[1]; i++) {
      for (let j = 0; j < map.dimensions[0]; j++) {
        const et = map.entities[i * map.dimensions[0] + j]
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

  setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  update(dt: number): void {
    this.entities.update(this, dt)

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
    this.emitters.forEach((e) =>
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

    if (DEBUG_MODE) {
      for (const id in this.entities.entities) {
        const e = this.entities.entities[id]

        if (!e.transform) {
          continue
        }

        if (e.damageable) {
          const aabb = e.damageable.aabb(e.transform)
          const d = vec2.sub(vec2.create(), aabb[1], aabb[0])

          this.renderer.render({
            primitive: Primitive.RECT,
            strokeStyle: 'cyan',
            pos: aabb[0],
            dimensions: d,
          })
        }

        if (e.damagerLogic) {
          const aabb = e.damagerLogic.aabb(e.transform)
          const d = vec2.sub(vec2.create(), aabb[1], aabb[0])

          this.renderer.render({
            primitive: Primitive.RECT,
            strokeStyle: 'magenta',
            pos: aabb[0],
            dimensions: d,
          })
        }
      }
    }
  }
}
