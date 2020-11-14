import { vec2 } from 'gl-matrix'

import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { Type } from '~/entities/types'
import * as models from '~/models'
import { PickupType } from '~/systems/pickups'

export const makeCorePickup = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.CORE

  e.transform = transform.make()
  e.pickupType = PickupType.Core
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }
  e.renderable = new DefaultModelRenderable(models.pickup)
  return e
}
