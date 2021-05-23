import { vec2, vec4 } from 'gl-matrix'

import * as damageable from '~/game/components/Damageable'
import * as transform from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { Type } from '~/game/entities/types'
import { EntityConfig, makeDefaultEntity } from '~/game/state/EntityConfig'
import { PickupType } from '~/game/systems/pickups'

const TREE_HEALTH = 0.1

export const makeTree = (): EntityConfig => {
  const e = makeDefaultEntity()
  e.type = Type.TREE

  e.obscuring = true
  e.harvestType = PickupType.Wood
  e.transform = transform.make()
  e.entityModel = {
    name: 'tree',
    color: vec4.fromValues(0, 1, 0, 1),
    modifiers: {},
  }
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }
  e.damageable = damageable.make(TREE_HEALTH, {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  })
  return e
}
