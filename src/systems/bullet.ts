import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityManager } from '~/entities/EntityManager'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 3)

export const update = (
  simState: { entityManager: EntityManager; debugDraw: IDebugDrawWriter },
  dt: number,
): void => {
  for (const [id, bullet] of simState.entityManager.bullets) {
    const transform = simState.entityManager.transforms.get(id)!
    const newPos = radialTranslate2(
      vec2.create(),
      transform.position,
      transform.orientation,
      BULLET_SPEED * dt,
    )

    simState.entityManager.transforms.update(id, { position: newPos })

    if (vec2.distance(newPos, bullet.origin) >= bullet.range) {
      simState.entityManager.markForDeletion(id)
      return
    }
  }
}
