import { vec2 } from 'gl-matrix'

import { Entity } from '~/entities/Entity'
import { Hitbox } from '~/Hitbox'

export class Damageable {
  health: number
  hitbox: Hitbox

  constructor(health: number, hitbox: Hitbox) {
    this.health = health
    this.hitbox = hitbox
  }

  aabb(entity: Entity): [vec2, vec2] {
    return this.hitbox.aabb(
      entity.transform!.position,
      entity.transform!.orientation,
    )
  }
}
