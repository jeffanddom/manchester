import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import * as terrain from '~/terrain'

export const update = (simState: {
  entityManager: EntityManager
  terrainLayer: terrain.Layer
}): void => {
  for (const id in simState.entityManager.entities) {
    const e = simState.entityManager.entities[id]
    if (!e.transform || !e.enablePlayfieldClamping) {
      continue
    }

    simState.entityManager.checkpointEntity(e.id)

    vec2.max(
      e.transform.position,
      e.transform.position,
      simState.terrainLayer.minWorldPos(),
    )
    vec2.min(
      e.transform.position,
      e.transform.position,
      simState.terrainLayer.maxWorldPos(),
    )
  }
}
