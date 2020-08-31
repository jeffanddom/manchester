import { vec2 } from 'gl-matrix'

import { Server } from '~/Game'

export const update = (s: Server): void => {
  for (const id in s.entityManager.entities) {
    const e = s.entityManager.entities[id]
    if (!e.transform) {
      continue
    }

    e.transform.previousPosition = vec2.clone(e.transform.position)
  }
}
