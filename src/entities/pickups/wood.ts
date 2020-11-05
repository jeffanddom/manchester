import { vec2 } from 'gl-matrix'

import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import * as transform from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityProperties,
  makeDefaultEntity,
} from '~/entities/EntityProperties'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'
import { PickupType } from '~/systems/pickups'

export const makeWoodPickup = (): EntityProperties => {
  const e = makeDefaultEntity()
  e.transform = transform.make()
  e.pickupType = PickupType.Wood
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )
  e.renderable = new DefaultModelRenderable(models.wood)
  return e
}
