import { TILE_SIZE, IEntity } from './common'
import { Entity } from './Entity'
import { path2 } from './path2'
import { Transform } from './Transform'
import { PlayerControl } from './PlayerControl'
import { Shooter } from './Shooter'
import { WallCollider } from './WallCollider'
import { PathRenderable } from './PathRenderable'

export const makePlayer = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.playerControl = new PlayerControl()
  e.shooter = new Shooter()
  e.wallCollider = new WallCollider()
  e.pathRenderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
    ]),
    '#000000',
  )

  return e
}
