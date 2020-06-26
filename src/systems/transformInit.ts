import { vec2 } from 'gl-matrix'

import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.transform) {
      continue
    }

    e.transform.previousPosition = vec2.clone(e.transform.position)
  }
}