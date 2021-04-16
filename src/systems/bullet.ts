import { mat4, vec2 } from 'gl-matrix'

import { BulletType } from '~/components/Bullet'
import { TILE_SIZE } from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityManager } from '~/entities/EntityManager'
import { PlusY3, radialTranslate2 } from '~/util/math'

const range: Record<BulletType, number> = {
  [BulletType.Standard]: 8 * TILE_SIZE,
  [BulletType.Rocket]: 12 * TILE_SIZE,
}
const speed: Record<BulletType, number> = {
  [BulletType.Standard]: 15 * TILE_SIZE,
  [BulletType.Rocket]: 0,
}
// const acceleration: Record<BulletType, Record<number, number> | undefined> = {
//   [BulletType.Standard]: undefined,
//   [BulletType.Rocket]: { 0: TILE_SIZE, 30: TILE_SIZE * 20 },
//   // [BulletType.Rocket]: TILE_SIZE * 20,
// }

export const update = (
  simState: { entityManager: EntityManager; debugDraw: IDebugDrawWriter },
  dt: number,
): void => {
  for (const [id, bullet] of simState.entityManager.bullets) {
    const transform = simState.entityManager.transforms.get(id)!
    let newPos
    switch (bullet.type) {
      case BulletType.Standard:
        newPos = radialTranslate2(
          vec2.create(),
          transform.position,
          transform.orientation,
          speed[bullet.type] * dt,
        )
        break
      case BulletType.Rocket:
        const currentSpeed = bullet.currentSpeed ?? speed[bullet.type]
        const acceleration = bullet.lifetime > 0.5 ? 50 : 3
        newPos = radialTranslate2(
          vec2.create(),
          transform.position,
          transform.orientation,
          currentSpeed * dt + 0.5 * acceleration * dt * dt,
        )
        simState.entityManager.bullets.update(id, {
          lifetime: bullet.lifetime + dt,
          currentSpeed: currentSpeed + acceleration * dt,
        })
        break
    }

    simState.entityManager.transforms.update(id, { position: newPos })

    if (vec2.distance(newPos, bullet.origin) >= range[bullet.type]) {
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
            PlusY3,
          ),
        },
      })
    }
  }
}
