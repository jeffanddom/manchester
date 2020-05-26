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

const BULLET_SPEED = 60 * (TILE_SIZE / 8)
const TIME_TO_LIVE = 2

class BulletMover implements IGenericComponent {
  ttl: number

  constructor() {
    this.ttl = TIME_TO_LIVE
  }

  update(entity: IEntity, game: IGame, dt: number): void {
    if (entity.wallCollider.hitLastFrame) {
      game.entities.markForDeletion(entity)

      const emitterPos = radialTranslate2(
        vec2.create(),
        entity.transform.position,
        entity.transform.orientation,
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

      game.camera.shake()

      return
    }

    this.ttl -= dt
    if (this.ttl <= 0) {
      game.entities.markForDeletion(entity)
      return
    }

    radialTranslate2(
      entity.transform.position,
      entity.transform.position,
      entity.transform.orientation,
      BULLET_SPEED * dt,
    )
  }
}

class BulletDamager implements IDamager {
  damageValue: number

  constructor(damageValue: number) {
    this.damageValue = damageValue
  }

  update(entity: IEntity, _game: IGame, _dt: number): void {
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
