import { vec2 } from 'gl-matrix'

import { Transform } from '~/entities/components/Transform'
import { Hitbox } from '~/Hitbox'

export class Damager {
  damageValue: number
  hitbox: Hitbox

  constructor(damageValue: number, hitbox: Hitbox) {
    this.damageValue = damageValue
    this.hitbox = hitbox
  }

  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position, transform.orientation)
  }
}
