import { vec2 } from 'gl-matrix'

import { Transform } from '~/components/Transform'
import { EntityId } from '~/entities/EntityId'
import { Hitbox } from '~/Hitbox'
import * as hitbox from '~/Hitbox'
import { Immutable } from '~/types/immutable'

export type Damager = {
  damageValue: number
  hitbox: Hitbox
  immuneList: EntityId[]
}

export function aabb(
  d: Immutable<Damager>,
  transform: Immutable<Transform>,
): [vec2, vec2] {
  return hitbox.aabb(d.hitbox, transform.position)
}

export function clone(d: Immutable<Damager>): Damager {
  return {
    damageValue: d.damageValue,
    hitbox: hitbox.clone(d.hitbox),
    immuneList: (d.immuneList as EntityId[]).slice(),
  }
}
