import { vec2 } from 'gl-matrix'

import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import * as transform from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { Entity, makeDefaultEntity } from '~/entities/Entity'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'
import { PickupType } from '~/systems/pickups'

export const makeCorePickup = (): Entity => {
  const e = makeDefaultEntity()
  e.type = Type.CORE

  e.transform = transform.make()
  e.pickupType = PickupType.Core
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )
  e.renderable = new DefaultModelRenderable(models.pickup)
  return e
}
