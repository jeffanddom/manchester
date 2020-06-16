import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IDamager, IMotionLogic } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { aabbOverlap, radialTranslate2 } from '~/util/math'
import { Some } from '~/util/Option'
import { path2 } from '~/util/path2'

const BULLET_SPEED = 60 * (TILE_SIZE / 8)

class MotionLogic implements IMotionLogic {
  origin: vec2
  range: number

  constructor(origin: vec2, range: number) {
    this.origin = origin
    this.range = range
  }

  update(transform: Transform, entityId: string, game: Game, dt: number): void {
    radialTranslate2(
      transform.position,
      transform.position,
      transform.orientation,
      BULLET_SPEED * dt,
    )

    if (vec2.distance(transform.position, this.origin) >= this.range) {
      game.entities.markForDeletion(entityId)
      return
    }
  }
}

class BulletDamager implements IDamager {
  damageValue: number
  hitbox: Hitbox

  constructor(damageValue: number, hitbox: Hitbox) {
    this.damageValue = damageValue
    this.hitbox = hitbox
  }

  aabb(entity: Entity) {
    return this.hitbox.aabb(
      entity.transform!.position,
      entity.transform!.orientation,
    )
  }

  update(entity: Entity, game: Game, _dt: number): void {
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
      if (game.player.equals(Some(c))) {
        game.camera.shake()
      }

      // Perform damage, kill bullet
      c.damageable.health = c.damageable.health - this.damageValue
      game.entities.markForDeletion(entity.id)
      return
    }
  }
}

export const makeBullet = ({
  position,
  orientation,
  range,
}: {
  position: vec2
  orientation: number
  range: number
}): Entity => {
  const e = new Entity()

  e.transform = new Transform()
  e.transform.position = vec2.clone(position)
  e.transform.orientation = orientation

  e.motionLogic = new MotionLogic(vec2.clone(position), range)
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
