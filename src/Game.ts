import { vec2, mat2d } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import { Playfield } from '~/Playfield'
import { GameMap, IGame } from '~/interfaces'
import { TILE_SIZE } from '~/constants'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Keyboard } from '~/Keyboard'
import { Camera } from '~/Camera'
import { IEntity } from '~/entities/interfaces'
import * as entities from '~/entities'
import * as renderable from '~/renderable'

let DEBUG_MODE = false

export class Game implements IGame {
  playfield: Playfield
  entities: EntityManager
  keyboard: Keyboard
  emitters: ParticleEmitter[]

  player: IEntity
  camera: Camera

  constructor(map: GameMap, viewportSize: vec2) {
    this.playfield = new Playfield(map.playfield)
    this.entities = new EntityManager()
    this.keyboard = new Keyboard()
    this.emitters = []

    this.camera = new Camera(
      viewportSize,
      this.playfield.minWorldPos(),
      this.playfield.dimensions(),
    )

    document.addEventListener('keyup', (event) => {
      if (event.which === 192) {
        DEBUG_MODE = !DEBUG_MODE
      }
    })

    // Populate entities
    const rows = map.entities.trim().split('\n')
    const width = rows[0].length
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < width; j++) {
        const et = entities.types.deserialize(rows[i][j])
        if (et !== undefined) {
          const entity = entities.types.make(et)

          if (entity.transform !== undefined) {
            entity.transform.position = vec2.fromValues(
              j * TILE_SIZE + TILE_SIZE * 0.5,
              i * TILE_SIZE + TILE_SIZE * 0.5,
            )
          }

          this.entities.register(entity)

          if (et === entities.types.Type.PLAYER) {
            this.player = entity
          }
        }
      }
    }
  }

  update(dt: number) {
    this.entities.update(this, dt)

    this.emitters = this.emitters.filter((e) => !e.dead)
    this.emitters.forEach((e) => e.update(dt))

    this.camera.setPosition(this.player.transform.position)
    this.camera.update(dt)

    this.keyboard.update()
  }

  render(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    renderable.render(
      ctx,
      {
        type: renderable.Type.RECT,
        fillStyle: 'magenta',
        floor: false,
        pos: vec2.fromValues(0, 0),
        dimensions: this.playfield.dimensions(),
      },
      mat2d.identity(mat2d.create()),
    )

    this.playfield.render(ctx, this.camera)
    this.entities.render(ctx, this.camera)
    this.emitters.forEach((e) => e.render(ctx, this.camera))

    if (DEBUG_MODE) {
      const wvTranform = this.camera.wvTransform()

      for (const id in this.entities.entities) {
        const e = this.entities.entities[id]

        ctx.strokeStyle = 'cyan'
        if (e.damageable) {
          const aabb = e.damageable.aabb(e)
          const d = vec2.sub(vec2.create(), aabb[1], aabb[0])

          renderable.render(
            ctx,
            {
              type: renderable.Type.RECT,
              strokeStyle: 'cyan',
              floor: false,
              pos: aabb[0],
              dimensions: d,
            },
            wvTranform,
          )
        }

        ctx.strokeStyle = 'magenta'
        if (e.damager) {
          const aabb = e.damager.aabb(e)
          const d = vec2.sub(vec2.create(), aabb[1], aabb[0])

          renderable.render(
            ctx,
            {
              type: renderable.Type.RECT,
              strokeStyle: 'magenta',
              floor: false,
              pos: aabb[0],
              dimensions: d,
            },
            wvTranform,
          )
        }
      }
    }
  }
}
