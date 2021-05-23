import { vec2, vec4 } from 'gl-matrix'

import * as transform from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { Type } from '~/game/entities/types'
import { EntityConfig, makeDefaultEntity } from '~/game/state/EntityConfig'
import { PickupType } from '~/game/systems/pickups'

export const makeCorePickup = (): EntityConfig => {
  const e = makeDefaultEntity()
  e.type = Type.CORE

  e.transform = transform.make()
  e.pickupType = PickupType.Core
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }
  e.entityModel = {
    name: 'core',
    color: vec4.fromValues(1, 1, 1, 1),
    modifiers: {},
  }
  return e
}
