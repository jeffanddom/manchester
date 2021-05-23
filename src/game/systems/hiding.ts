import { StateDb } from '~/engine/sim/StateDb'
import { aabb as hitboxAabb } from '~/game/components/Hitbox'
import * as aabb2 from '~/util/aabb2'

const REQUIRED_OVERLAP = 0.5

export const update = (stateDb: StateDb): void => {
  for (const id of stateDb.friendlyTeam) {
    const hitbox = stateDb.hitboxes.get(id)!
    const transform = stateDb.transforms.get(id)!
    const obscurableAabb = hitboxAabb(hitbox, transform.position)
    const obscuringAabbs = stateDb
      .queryByWorldPos(obscurableAabb)
      .filter((oid) => stateDb.obscurings.has(oid))
      .map((oid) => {
        const obscuringHitbox = stateDb.hitboxes.get(oid)!
        const obscuringTransform = stateDb.transforms.get(oid)!
        return hitboxAabb(obscuringHitbox, obscuringTransform.position)
      })
    const checkArea = hitbox.dimensions[0] * hitbox.dimensions[1]

    let overlap = 0
    let currentlyObscured = false
    for (const obscuringAabb of obscuringAabbs) {
      overlap += aabb2.overlapArea(obscuringAabb, obscurableAabb) / checkArea

      if (overlap > REQUIRED_OVERLAP) {
        currentlyObscured = true
        break
      }
    }

    if (currentlyObscured !== stateDb.obscureds.has(id)) {
      if (currentlyObscured) {
        stateDb.obscureds.add(id)
      } else {
        stateDb.obscureds.delete(id)
      }
    }
  }
}
