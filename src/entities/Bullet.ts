import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IDamagerScript, IMotionScript } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { aabbOverlap, radialTranslate2, vec2FromValuesBatch } from '~/util/math'
import { Some } from '~/util/Option'

const BULLET_SPEED = 60 * (TILE_SIZE / 8)

class MotionScript implements IMotionScript {
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

class BulletDamager implements IDamagerScript {
  damageValue: number
  hitbox: Hitbox

  constructor(damageValue: number, hitbox: Hitbox) {
    this.damageValue = damageValue
    this.hitbox = hitbox
  }

  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position, transform.orientation)
  }

  update(transform: Transform, entityId: string, game: Game): void {
    const aabb = this.aabb(transform)

    for (const id in game.entities.entities) {
      const c = game.entities.entities[id]

      if (!c.damageable || !c.transform) {
        continue
      }

      if (!aabbOverlap(c.damageable.aabb(c.transform), aabb)) {
        continue
      }

      // Show explosion
      const emitterPos = radialTranslate2(
        vec2.create(),
        transform.position,
        transform.orientation,
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
      game.entities.markForDeletion(entityId)
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

  e.motionScript = new MotionScript(vec2.clone(position), range)
  e.renderable = new PathRenderable(
    vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
    ]),
    '#FF0000',
  )

  e.damagerScript = new BulletDamager(
    1,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.1, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.2, TILE_SIZE * 0.2),
    ),
  )

  return e
}
