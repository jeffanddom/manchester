import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import * as hitbox from '~/Hitbox'
import { Immutable } from '~/types/immutable'

export type Damageable = {
  maxHealth: number
  health: number
  hitbox: hitbox.Hitbox
}

export function make(health: number, hitbox: hitbox.Hitbox): Damageable {
  return {
    maxHealth: health,
    health: health,
    hitbox: hitbox,
  }
}

export function aabb(
  d: Immutable<Damageable>,
  transform: Immutable<Transform>,
): [vec2, vec2] {
  return hitbox.aabb(d.hitbox, transform.position)
}

export function clone(d: Immutable<Damageable>): Damageable {
  const c = make(d.maxHealth, hitbox.clone(d.hitbox))
  c.health = d.health
  return c
}
