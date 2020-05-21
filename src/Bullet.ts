import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IEntity, IGenericComponent, IDamager } from './common'
import { path2 } from './path2'
import { Entity } from './Entity'
import { Transform } from './Transform'
import { WallCollider } from './WallCollider'
import { PathRenderable } from './PathRenderable'
import { ParticleEmitter } from './ParticleEmitter'

const BULLET_SPEED = vec2.fromValues(0, -TILE_SIZE / 8)
const TIME_TO_LIVE = 1000

class BulletMover implements IGenericComponent {
  spawnedAt: number

  constructor() {
    this.spawnedAt = Date.now()
  }

  update(entity: IEntity): void {
    if (entity.wallCollider.hitLastFrame) {
      entity.game.entities.markForDeletion(entity)

      const emitterPos = vec2.add(
        vec2.create(),
        entity.transform.position,
        vec2.rotate(
          vec2.create(),
          [0, -TILE_SIZE/2], // PARTICLE SPEED - change me
          [0, 0],
          entity.transform.orientation,
        ),
      )
      const explosion = new ParticleEmitter({
        position: emitterPos,
        particleLifespan: 100,
        particleRadius: 10,
        particleSpeedRange: [1.5,2.5],
        particleRate: 4.5,
        emitterLifespan: 200,
        orientation: 0,
        arc: Math.PI * 2,
        colors: [
          '#FF4500',
          '#FFA500',
          '#FFD700',
          '#000'
        ]
      })
      entity.game.emitters.push(explosion)

      return
    }

    if (Date.now() - this.spawnedAt > TIME_TO_LIVE) {
      entity.game.entities.markForDeletion(entity)
      return
    }

    entity.transform.position = vec2.add(
      entity.transform.position,
      entity.transform.position,
      vec2.rotate(
        vec2.create(),
        BULLET_SPEED,
        [0, 0],
        entity.transform.orientation,
      ),
    )
  }
}

class BulletDamager implements IDamager {
  damageValue: number

  constructor(damageValue) {
    this.damageValue = damageValue
  }

  update(entity: IEntity) {
    const collided = entity.wallCollider.collidedWalls
    collided.forEach(c => {
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
  e.transform.position = vec2.copy(vec2.create(), position)
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
