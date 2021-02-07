import { Hitbox } from '~/components/Hitbox'
import * as hitbox from '~/components/Hitbox'
import { Transform } from '~/components/Transform'
import { EntityId } from '~/entities/EntityId'
import { Immutable } from '~/types/immutable'
import { Aabb2 } from '~/util/aabb2'

export type Damager = {
  damageValue: number
  hitbox: Hitbox
  immuneList: EntityId[]
}

export function aabb(
  d: Immutable<Damager>,
  transform: Immutable<Transform>,
): Aabb2 {
  return hitbox.aabb(d.hitbox, transform.position)
}

export function clone(d: Immutable<Damager>): Damager {
  return {
    damageValue: d.damageValue,
    hitbox: hitbox.clone(d.hitbox),
    immuneList: (d.immuneList as EntityId[]).slice(),
  }
}
