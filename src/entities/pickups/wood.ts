import { vec2 } from 'gl-matrix'

import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { PickupType } from '~/systems/pickups'

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
