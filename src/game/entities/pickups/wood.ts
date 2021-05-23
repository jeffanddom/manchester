import { vec2 } from 'gl-matrix'

import {
  EntityComponents,
  makeDefaultEntity,
} from '~/engine/state/EntityComponents'
import * as transform from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { PickupType } from '~/game/systems/pickups'

export const makeWoodPickup = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.transform = transform.make()
  e.pickupType = PickupType.Wood
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }
  e.renderable = 'not a real thing' // fixme
  return e
}
