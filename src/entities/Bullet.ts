import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IDamager, IGenericComponent } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { IEntity } from '~/entities/interfaces'
import { Hitbox } from '~/Hitbox'
import { IGame } from '~/interfaces'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { aabbOverlap, radialTranslate2 } from '~/util/math'
import { path2 } from '~/util/path2'

const BULLET_SPEED = 60 * (TILE_SIZE / 8)
const TIME_TO_LIVE = 2

class BulletMover implements IGenericComponent {
  ttl: number

  constructor() {
    this.ttl = TIME_TO_LIVE
  }

  update(entity: IEntity, game: IGame, dt: number): void {
    this.ttl -= dt
    if (this.ttl <= 0) {
      game.entities.markForDeletion(entity)
      return
    }

    radialTranslate2(
      entity.transform!.position,
      entity.transform!.position,
      entity.transform!.orientation,
      BULLET_SPEED * dt,
    )
  }
}

class BulletDamager implements IDamager {
  damageValue: number
  hitbox: Hitbox

  constructor(damageValue: number, hitbox: Hitbox) {
    this.damageValue = damageValue
    this.hitbox = hitbox
  }

  aabb(entity: IEntity) {
    return this.hitbox.aabb(
      entity.transform!.position,
      entity.transform!.orientation,
    )
  }

  update(entity: IEntity, game: IGame, _dt: number): void {
    const aabb = this.aabb(entity)

    for (const id in game.entities.entities) {
      const c = game.entities.entities[id]

      if (c.damageable === undefined) {
        continue
      }
      if (!aabbOverlap(c.damageable.aabb(c), aabb)) {
        continue
      }

      // Show explosion
      const emitterPos = radialTranslate2(
        vec2.create(),
        entity.transform!.position,
        entity.transform!.orientation,
        TILE_SIZE / 2,
      )

      const explosion = new ParticleEmitter({
        spawnTtl: 0.2,
        position: emitterPos,
        particleTtl: 0.1,
        particleRadius: 10,
        particleSpeedRange: [90, 125],
        particleRate: 270,
        orientation: 0,
        arc: Math.PI * 2,
        colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
      })
      game.emitters.push(explosion)

      // Camera shake
      if (c === game.player.unwrap()) {
        game.camera.shake()
      }

      // Perform damage, kill bullet
      c.damageable.health = c.damageable.health - this.damageValue
      game.entities.markForDeletion(entity)
      return
    }
  }
}

export const makeBullet = (position: vec2, orientation: number): IEntity => {
  const e = new Entity()

  e.transform = new Transform()
  e.transform.position = vec2.clone(position)
  e.transform.orientation = orientation

  e.mover = new BulletMover()
  e.renderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
    ]),
    '#FF0000',
  )

  e.damager = new BulletDamager(
    1,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.1, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.2, TILE_SIZE * 0.2),
    ),
  )

  return e
}
