import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 6)

export const update = (
  simState: { entityManager: EntityManager },
  dt: number,
): void => {
  for (const id in simState.entityManager.entities) {
    const e = simState.entityManager.entities[id]
    if (!e.bullet) {
      continue
    }

    simState.entityManager.checkpointEntity(e.id)

    radialTranslate2(
      e.transform!.position,
      e.transform!.position,
      e.transform!.orientation,
      BULLET_SPEED * dt,
    )

    if (
      vec2.distance(e.transform!.position, e.bullet.origin) >= e.bullet.range
    ) {
      simState.entityManager.markForDeletion(id)
      return
    }
  }
}
