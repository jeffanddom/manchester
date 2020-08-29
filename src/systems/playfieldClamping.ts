import { vec2 } from 'gl-matrix'

import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.server.entityManager.entities) {
    const e = g.server.entityManager.entities[id]
    if (!e.transform || !e.enablePlayfieldClamping) {
      continue
    }

    vec2.max(
      e.transform.position,
      e.transform.position,
      g.terrainLayer.minWorldPos(),
    )
    vec2.min(
      e.transform.position,
      e.transform.position,
      g.terrainLayer.maxWorldPos(),
    )
  }
}
