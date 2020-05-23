import { TILE_SIZE } from '~/constants'
import { path2 } from '~/path2'
import { Entity } from '~/entities/Entity'
import { Transform } from '~/entities/components/Transform'
import { Damageable } from '~/entities/components/Damageable'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { lerp } from '~/mathutil'
import { IEntity } from '~/entities/interfaces'
import { IGenericComponent } from '~/entities/components/interfaces'

const WALL_HEALTH = 4.0

class DisplayWallDamage implements IGenericComponent {
  update(entity: IEntity): void {
    const color = lerp(90, 130, entity.damageable.health / WALL_HEALTH)
    entity.pathRenderable.fillStyle = `rgba(${color},${color},${color},1)`
  }
}

class WallComponent implements IGenericComponent {
  update(entity: IEntity): void {}
}

export const makeWall = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.wall = new WallComponent()
  e.pathRenderable = new PathRenderable(
    path2.fromValues([
      [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
    ]),
    '#000',
  )
  e.damageable = new Damageable(WALL_HEALTH)
  e.prerender = new DisplayWallDamage()
  return e
}
