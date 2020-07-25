import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { PickupModels, PickupType } from '~/entities/pickup'
import { Hitbox } from '~/Hitbox'

export const makeNadaPickup = (_model: {
  path: Array<vec2>
  fillStyle: string
}): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.pickupType = PickupType.Core
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
    false,
  )

  e.renderable = new PathRenderable(
    PickupModels[PickupType.Core][0].path,
    PickupModels[PickupType.Core][0].fillStyle,
  )
  return e
}
