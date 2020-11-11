import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import { EntityId } from '~/entities/EntityId'
import { Hitbox } from '~/Hitbox'

export class Damager {
  damageValue: number
  hitbox: Hitbox
  immuneList: EntityId[]

  constructor({
    damageValue,
    hitbox,
    immuneList,
  }: {
    damageValue: number
    hitbox: Hitbox
    immuneList: EntityId[]
  }) {
    this.damageValue = damageValue
    this.hitbox = hitbox
    this.immuneList = immuneList
  }

  aabb(transform: Transform): [vec2, vec2] {
    return this.hitbox.aabb(transform.position)
  }

  clone(): Damager {
    return new Damager({
      damageValue: this.damageValue,
      hitbox: this.hitbox.clone(),
      immuneList: this.immuneList.slice(),
    })
  }
}
