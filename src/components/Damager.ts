import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import { Hitbox } from '~/Hitbox'

export class Damager {
  damageValue: number
  hitbox: Hitbox
  immuneList: string[]

  constructor({
    damageValue,
    hitbox,
    immuneList,
  }: {
    damageValue: number
    hitbox: Hitbox
    immuneList: string[]
  }) {
    this.damageValue = damageValue
    this.hitbox = hitbox
    this.immuneList = immuneList
  }

  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position)
  }
}
