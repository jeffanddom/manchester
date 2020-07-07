import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IPickupScript } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'

class PickupScript implements IPickupScript {
  hitbox: Hitbox

  constructor(hitbox: Hitbox) {
    this.hitbox = hitbox
  }
  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position, transform.orientation)
  }

  update(_game: Game): void {
    // nada
  }
}

export const makeNadaPickup = (model: {
  path: Array<vec2>
  fillStyle: string
}): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.pickupScript = new PickupScript(
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
      false,
    ),
  )

  e.renderable = new PathRenderable(model.path, model.fillStyle)
  return e
}
