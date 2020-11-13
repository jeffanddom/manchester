import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import * as terrain from '~/terrain'

export const update = (simState: {
  entityManager: EntityManager
  terrainLayer: terrain.Layer
}): void => {
  for (const id of simState.entityManager.playfieldClamped) {
    const position = vec2.clone(
      simState.entityManager.transforms.get(id)!.position,
    )

    vec2.max(position, position, simState.terrainLayer.minWorldPos())
    vec2.min(position, position, simState.terrainLayer.maxWorldPos())

    simState.entityManager.transforms.update(id, { position })
  }
}
