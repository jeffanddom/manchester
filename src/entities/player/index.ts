import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { path2 } from '~/path2'
import { Transform } from '~/entities/components/Transform'
import { Shooter } from '~entities/player/Shooter'
import { Mover } from '~entities/player/Mover'
import { WallCollider } from '~/entities/components/WallCollider'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { IEntity } from '~/entities/interfaces'
import { PlayfieldClamper } from '~/entities/components/PlayfieldClamper'
import { Damageable } from '~entities/components/Damageable'
import { Hitbox } from '~Hitbox'
import { vec2 } from 'gl-matrix'

export const makePlayer = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.mover = new Mover()
  e.shooter = new Shooter()
  e.wallCollider = new WallCollider()
  e.damageable = new Damageable(
    5,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
      false,
    ),
  )
  e.playfieldClamper = new PlayfieldClamper()
  e.renderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
    ]),
    '#000000',
  )

  return e
}
