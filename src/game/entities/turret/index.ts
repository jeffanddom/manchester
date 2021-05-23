import { vec4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import {
  EntityComponents,
  makeDefaultEntity,
} from '~/engine/state/EntityComponents'
import * as damageable from '~/game/components/Damageable'
import { Team } from '~/game/components/team'
import * as transform from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { Type } from '~/game/entities/types'
import { PickupType } from '~/game/systems/pickups'
import * as turret from '~/game/systems/turret'

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
