import { vec3 } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { DebugDraw } from '~/DebugDraw'
import { EntityManager } from '~/entities/EntityManager'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 3)

export const update = (
  simState: { entityManager: EntityManager; debugDraw: DebugDraw },
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

    simState.debugDraw.draw3d(() => [
      {
        lifetime: 15,
        object: {
          type: 'CUBE',
          pos: vec3.fromValues(newPos[0], 0.5, newPos[1]),
          scale: 0.5,
          color: vec4.fromValues(1, 0, 1, 1),
        },
      },
    ])

    if (vec2.distance(newPos, bullet.origin) >= bullet.range) {
      simState.entityManager.markForDeletion(id)
      return
    }
  }
}
