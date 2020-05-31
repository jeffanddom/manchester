import { TILE_SIZE } from '~/constants'
import { path2 } from '~/path2'
import { Entity } from '~/entities/Entity'
import { Transform } from '~/entities/components/Transform'
import { Damageable } from '~/entities/components/Damageable'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { lerp } from '~/mathutil'
import { IEntity } from '~/entities/interfaces'
import { IGenericComponent } from '~/entities/components/interfaces'
import { vec2 } from 'gl-matrix'
import { Hitbox } from '~/Hitbox'

const WALL_HEALTH = 4.0

class DisplayWallDamage implements IGenericComponent {
  update(entity: IEntity): void {
    const color = lerp(90, 130, entity.damageable.health / WALL_HEALTH)
    entity.renderable.setFillStyle(`rgba(${color},${color},${color},1)`)
  }
}

export const makeWall = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.wall = { update: () => {} }
  e.renderable = new PathRenderable(
    path2.fromValues([
      [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
    ]),
    '#000',
  )
  e.damageable = new Damageable(
    WALL_HEALTH,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  e.prerender = new DisplayWallDamage()
  return e
}
