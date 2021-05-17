import { vec2, vec4 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { Type } from '~/entities/types'
import { EntityComponents, makeDefaultEntity } from '~/sim/EntityComponents'
import { PickupType } from '~/systems/pickups'

const TREE_HEALTH = 0.1

export const makeTree = (): EntityComponents => {
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
