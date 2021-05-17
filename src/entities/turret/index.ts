import { vec4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { Type } from '~/entities/types'
import { EntityComponents, makeDefaultEntity } from '~/sim/EntityComponents'
import { PickupType } from '~/systems/pickups'
import * as turret from '~/systems/turret'

export const makeTurret = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.TURRET

  e.wall = true
  e.targetable = true
  e.team = Team.Enemy
  e.dropType = PickupType.Core

  e.transform = transform.make()
  e.turret = turret.make()
  e.damageable = damageable.make(3, {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  })
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }
  e.entityModel = {
    name: 'turret',
    color: vec4.fromValues(1, 1, 1, 1),
    modifiers: {},
  }

  return e
}
