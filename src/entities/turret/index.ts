import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { path2 } from '~/path2'
import { Transform } from '~/entities/components/Transform'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { IGame } from '~/interfaces'
import { radialTranslate2 } from '~/mathutil'
import { IEntity } from '~/entities/interfaces'
import { IGenericComponent } from '~/entities/components/interfaces'
import { Shooter } from '~entities/turret/Shooter'
import { Damageable } from '~entities/components/Damageable'
import { Hitbox } from '~Hitbox'
import { vec2 } from 'gl-matrix'

export const makeTurret = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.wall = { update: () => {} }
  // e.shooter = new Shooter()
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  e.renderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
    ]),
    '#FF0',
  )

  return e
}
