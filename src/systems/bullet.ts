import { mat4, vec2, vec3 } from 'gl-matrix'

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

    const model = simState.entityManager.entityModels.get(id)
    if (model !== undefined) {
      simState.entityManager.entityModels.update(id, {
        modifiers: {
          ...model.modifiers,
          'bullet:post': mat4.fromRotation(
            mat4.create(),
            -transform.orientation, // rotations on XZ plane need to be negated
            vec3.fromValues(0, 1, 0),
          ),
        },
      })
    }
  }
}
