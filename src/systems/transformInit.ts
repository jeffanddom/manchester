import { vec2 } from 'gl-matrix'

import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.server.entityManager.entities) {
    const e = g.server.entityManager.entities[id]
    if (!e.transform) {
      continue
    }

    e.transform.previousPosition = vec2.clone(e.transform.position)
  }
}
