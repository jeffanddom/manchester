import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import { aabbOverlapArea } from '~/util/math'

const REQUIRED_OVERLAP = 0.5

export const update = (entityManager: EntityManager): void => {
  const obscuringAabbs: [vec2, vec2][] = []

  // TODO: use spatial index to limit the size of this list
  for (const id of entityManager.obscurings) {
    const hitbox = entityManager.hitboxes.get(id)!
    const transform = entityManager.transforms.get(id)!
    obscuringAabbs.push(hitbox.aabb(transform.position))
  }

  for (const id of entityManager.friendlyTeam) {
    const hitbox = entityManager.hitboxes.get(id)!
    const transform = entityManager.transforms.get(id)!
    const obscurableAabb = hitbox.aabb(transform.position)
    const checkArea = hitbox.dimensions[0] * hitbox.dimensions[1]

    let overlap = 0
    let currentlyObscured = false
    for (const obscuringAabb of obscuringAabbs) {
      overlap += aabbOverlapArea(obscuringAabb, obscurableAabb) / checkArea

      if (overlap > REQUIRED_OVERLAP) {
        currentlyObscured = true
        break
      }
    }

    if (currentlyObscured !== entityManager.obscureds.has(id)) {
      entityManager.checkpoint(id)

      if (currentlyObscured) {
        entityManager.obscureds.add(id)
      } else {
        entityManager.obscureds.delete(id)
      }
    }
  }
}
