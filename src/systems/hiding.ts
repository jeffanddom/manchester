import { aabb as hitboxAabb } from '~/components/Hitbox'
import { EntityManager } from '~/entities/EntityManager'
import * as aabb2 from '~/util/aabb2'

const REQUIRED_OVERLAP = 0.5

export const update = (entityManager: EntityManager): void => {
  for (const id of entityManager.friendlyTeam) {
    const hitbox = entityManager.hitboxes.get(id)!
    const transform = entityManager.transforms.get(id)!
    const obscurableAabb = hitboxAabb(hitbox, transform.position)
    const obscuringAabbs = entityManager
      .queryByWorldPos(obscurableAabb)
      .filter((oid) => entityManager.obscurings.has(oid))
      .map((oid) => {
        const obscuringHitbox = entityManager.hitboxes.get(oid)!
        const obscuringTransform = entityManager.transforms.get(oid)!
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

    if (currentlyObscured !== entityManager.obscureds.has(id)) {
      if (currentlyObscured) {
        entityManager.obscureds.add(id)
      } else {
        entityManager.obscureds.delete(id)
      }
    }
  }
}
