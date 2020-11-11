import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import { Hitbox } from '~/Hitbox'

export class Damageable {
  maxHealth: number
  health: number
  hitbox: Hitbox

  constructor(health: number, hitbox: Hitbox) {
    this.maxHealth = health
    this.health = health
    this.hitbox = hitbox
  }

  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position)
  }

  clone(): Damageable {
    const c = new Damageable(this.maxHealth, this.hitbox.clone())
    c.health = this.health
    return c
  }
}
