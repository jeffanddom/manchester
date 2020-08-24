import { vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { Team } from '~/components/team'
import * as transform from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { TurretRenderables } from '~/entities/turret/TurretRenderables'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { PickupType } from '~/systems/pickups'
import { TurretComponent } from '~/systems/turret'

export const makeTurret = (): Entity => {
  const e = new Entity()
  e.type = Type.TURRET

  e.wall = true
  e.targetable = true
  e.team = Team.Enemy
  e.dropType = PickupType.Core

  e.transform = transform.make()
  e.turret = new TurretComponent()
  e.damageable = new Damageable(
    3,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )
  e.renderable = new TurretRenderables()

  return e
}
