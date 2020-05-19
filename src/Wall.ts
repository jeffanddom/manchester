import { TILE_SIZE, IEntity, IGenericComponent } from './common'
import { path2 } from './path2'
import { Entity } from './Entity'
import { Transform } from './Transform'
import { PathRenderable } from './PathRenderable'

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
    '#666',
  )
  return e
}
