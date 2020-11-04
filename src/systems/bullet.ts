import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 3)

export const update = (
  simState: { entityManager: EntityManager },
  dt: number,
): void => {
  for (const [id, bullet] of simState.entityManager.bullets) {
    simState.entityManager.checkpoint(id)

    const transform = simState.entityManager.transforms.get(id)!

    radialTranslate2(
      transform.position,
      transform.position,
      transform.orientation,
      BULLET_SPEED * dt,
    )

    if (vec2.distance(transform.position, bullet.origin) >= bullet.range) {
      simState.entityManager.markForDeletion(id)
      return
    }
  }
}
