import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import * as terrain from '~/terrain'

export const update = (simState: {
  entityManager: EntityManager
  terrainLayer: terrain.Layer
}): void => {
  for (const id of simState.entityManager.playfieldClamped) {
    const transform = simState.entityManager.transforms.get(id)!

    vec2.max(
      transform.position,
      transform.position,
      simState.terrainLayer.minWorldPos(),
    )
    vec2.min(
      transform.position,
      transform.position,
      simState.terrainLayer.maxWorldPos(),
    )
  }
}
