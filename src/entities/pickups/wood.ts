import { vec2 } from 'gl-matrix'

import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import { Transform } from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'
import { PickupType } from '~/systems/pickups'

export const makeWoodPickup = (): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.pickupType = PickupType.Wood
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )
  e.renderable = new DefaultModelRenderable(models.wood)
  return e
}