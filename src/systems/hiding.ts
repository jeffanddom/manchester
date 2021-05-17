import { aabb as hitboxAabb } from '~/components/Hitbox'
import { SimState } from '~/sim/SimState'
import * as aabb2 from '~/util/aabb2'

const REQUIRED_OVERLAP = 0.5

export const update = (simState: SimState): void => {
  for (const id of simState.friendlyTeam) {
    const hitbox = simState.hitboxes.get(id)!
    const transform = simState.transforms.get(id)!
    const obscurableAabb = hitboxAabb(hitbox, transform.position)
    const obscuringAabbs = simState
      .queryByWorldPos(obscurableAabb)
      .filter((oid) => simState.obscurings.has(oid))
      .map((oid) => {
        const obscuringHitbox = simState.hitboxes.get(oid)!
        const obscuringTransform = simState.transforms.get(oid)!
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

    if (currentlyObscured !== simState.obscureds.has(id)) {
      if (currentlyObscured) {
        simState.obscureds.add(id)
      } else {
        simState.obscureds.delete(id)
      }
    }
  }
}
