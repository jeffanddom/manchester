import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { PickupType } from '~/entities/pickup'
import { Team } from '~/entities/team'
import { Turret } from '~/entities/turret/Turret'
import { TurretRenderables } from '~/entities/turret/TurretRenderables'
import { Hitbox } from '~/Hitbox'

export const makeTurret = (): Entity => {
  const e = new Entity()
  e.wall = true
  e.team = Team.Enemy
  e.dropType = PickupType.Core

  e.transform = new Transform()
  e.turret = new Turret()
  e.damageable = new Damageable(
    3,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
      false,
    ),
  )
  e.renderable = new TurretRenderables()

  return e
}
