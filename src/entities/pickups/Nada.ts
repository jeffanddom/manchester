import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { DefaultModelRenderable } from '~/entities/components/DefaultModelRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { PickupType } from '~/entities/pickup'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'

export const makeNadaPickup = (): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.pickupType = PickupType.Core
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
    false,
  )
  e.renderable = new DefaultModelRenderable(models.pickup)
  return e
}
