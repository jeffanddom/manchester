import { vec2 } from 'gl-matrix'
import { IGame } from '~/interfaces'
import { TILE_SIZE } from '~/constants'
import { path2 } from '~/path2'
import { Entity } from '~/entities/Entity'
import { Transform } from '~/entities/components/Transform'
import { WallCollider } from '~/entities/components/WallCollider'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { radialTranslate2 } from '~/mathutil'
import { IEntity } from '~/entities/interfaces'
import { IGenericComponent, IDamager } from '~/entities/components/interfaces'

const BULLET_SPEED = TILE_SIZE / 8
const TIME_TO_LIVE = 2000

class BulletMover implements IGenericComponent {
  spawnedAt: number

  constructor() {
    this.spawnedAt = Date.now()
  }

  update(entity: IEntity, game: IGame): void {
    if (entity.wallCollider.hitLastFrame) {
      game.entities.markForDeletion(entity)

      const emitterPos = radialTranslate2(
        vec2.create(),
        entity.transform.position,
        entity.transform.orientation,
        TILE_SIZE / 2,
      )

      const explosion = new ParticleEmitter({
        position: emitterPos,
        particleLifespan: 100,
        particleRadius: 10,
        particleSpeedRange: [1.5, 2.5],
        particleRate: 4.5,
        emitterLifespan: 200,
        orientation: 0,
        arc: Math.PI * 2,
        colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
      })
      game.emitters.push(explosion)

      game.camera.shake()

      return
    }

    if (Date.now() - this.spawnedAt > TIME_TO_LIVE) {
      game.entities.markForDeletion(entity)
      return
    }

    radialTranslate2(
      entity.transform.position,
      entity.transform.position,
      entity.transform.orientation,
      BULLET_SPEED,
    )
  }
}

class BulletDamager implements IDamager {
  damageValue: number

  constructor(damageValue: number) {
    this.damageValue = damageValue
  }

  update(entity: IEntity) {
    const collided = entity.wallCollider.collidedWalls
    collided.forEach((c) => {
      if (c.damageable === undefined) {
        return
      }

      c.damageable.health = c.damageable.health - this.damageValue
    })
  }
}

export const makeBullet = (position: vec2, orientation: number): IEntity => {
  const e = new Entity()

  e.transform = new Transform()
  e.transform.position = vec2.clone(position)
  e.transform.orientation = orientation

  e.wallCollider = new WallCollider()
  e.mover = new BulletMover()
  e.pathRenderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
    ]),
    '#FF00FF',
  )

  e.damager = new BulletDamager(1)

  return e
}
