import { vec2 } from 'gl-matrix'

import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.transform || !e.enablePlayfieldClamping) {
      continue
    }

    vec2.max(
      e.transform.position,
      e.transform.position,
      g.terrain.minWorldPos(),
    )
    vec2.min(
      e.transform.position,
      e.transform.position,
      g.terrain.maxWorldPos(),
    )
  }
}
