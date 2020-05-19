import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IEntity, IGenericComponent } from './common'
import { path2 } from './path2'
import { Entity } from './Entity'
import { Transform } from './Transform'
import { WallCollider } from './WallCollider'
import { PathRenderable } from './PathRenderable'

const BULLET_SPEED = vec2.fromValues(0, -TILE_SIZE / 8)
const TIME_TO_LIVE = 1000

class BulletScript implements IGenericComponent {
  spawnedAt: number

  constructor() {
    this.spawnedAt = Date.now()
  }

  update(entity: IEntity): void {
    if (entity.wallCollider.hitLastFrame) {
      entity.game.entities.markForDeletion(entity)
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

export const makeBullet = (position: vec2, orientation: number): IEntity => {
  const e = new Entity()

  e.transform = new Transform()
  e.transform.position = vec2.copy(vec2.create(), position)
  e.transform.orientation = orientation

  e.wallCollider = new WallCollider()
  e.script = new BulletScript()
  e.pathRenderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
    ]),
    '#FF00FF',
  )

  return e
}
