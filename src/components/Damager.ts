import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import { EntityId } from '~/entities/EntityId'
import { Hitbox } from '~/Hitbox'
import * as hitbox from '~/Hitbox'
import { Immutable } from '~/types/immutable'

export class Damager {
  damageValue: number
  hitbox: Hitbox
  immuneList: EntityId[]

  constructor(config: {
    damageValue: number
    hitbox: Hitbox
    immuneList: EntityId[]
  }) {
    this.damageValue = config.damageValue
    this.hitbox = config.hitbox
    this.immuneList = config.immuneList
  }

  aabb(transform: Immutable<Transform>): [vec2, vec2] {
    return hitbox.aabb(this.hitbox, transform.position)
  }

  clone(): Damager {
    return new Damager({
      damageValue: this.damageValue,
      hitbox: hitbox.clone(this.hitbox),
      immuneList: this.immuneList.slice(),
    })
  }
}
