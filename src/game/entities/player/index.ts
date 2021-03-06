import { vec2, vec4 } from 'gl-matrix'

import * as damageable from '~/game/components/Damageable'
import { Team } from '~/game/components/team'
import * as transform from '~/game/components/Transform'
import { PLAYER_HEALTH, TILE_SIZE } from '~/game/constants'
import { Type } from '~/game/entities/types'
import { EntityConfig, makeDefaultEntity } from '~/game/state/EntityConfig'
import * as shooter from '~/game/systems/shooter'
import * as tankMover from '~/game/systems/tankMover'

export const makePlayer = (): EntityConfig => {
  const e = makeDefaultEntity()

  e.type = Type.PLAYER
  e.playfieldClamped = true
  e.targetable = true
  e.team = Team.Friendly
  e.moveable = true
  e.damageable = damageable.make(PLAYER_HEALTH, {
    offset: vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
  })
  e.inventory = []
  e.entityModel = {
    name: 'shiba',
    color: vec4.fromValues(1, 1, 1, 1),
    modifiers: {},
  }
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
  }
  e.shooter = shooter.make()
  e.transform = transform.make()
  e.tankMover = tankMover.make()

  return e
}
