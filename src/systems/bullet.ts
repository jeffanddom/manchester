import { mat4, vec2 } from 'gl-matrix'

import { makeExplosion } from './explosion'

import { BulletType } from '~/components/Bullet'
import { MORTAR_TTL, TILE_SIZE } from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityManager } from '~/entities/EntityManager'
import * as emitter from '~/systems/emitter'
import { PlusY3, radialTranslate2 } from '~/util/math'

const range: Record<BulletType, number> = {
  [BulletType.Standard]: 8 * TILE_SIZE,
  [BulletType.Rocket]: 12 * TILE_SIZE,
  [BulletType.Mortar]: 15,
}
const speed: Record<BulletType, number> = {
  [BulletType.Standard]: 15 * TILE_SIZE,
  [BulletType.Rocket]: 3,
  [BulletType.Mortar]: 0,
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
    const nextLifetime = bullet.lifetime + dt

    const transform = simState.entityManager.transforms.get(id)!
    let newPos
    switch (bullet.type) {
      case BulletType.Standard:
        {
          newPos = radialTranslate2(
            vec2.create(),
            transform.position,
            transform.orientation,
            speed[bullet.type] * dt,
          )
        }
        break

      case BulletType.Rocket:
        {
          const currentSpeed = bullet.currentSpeed ?? speed[bullet.type]

          if (bullet.lifetime < 0.5 && 0.5 <= nextLifetime) {
            simState.entityManager.emitters.set(
              id,
              emitter.make('rocketExhaust', vec2.fromValues(0, -0.25), Math.PI),
            )
          }

          const acceleration = bullet.lifetime > 0.5 ? 50 : 3
          newPos = radialTranslate2(
            vec2.create(),
            transform.position,
            transform.orientation,
            currentSpeed * dt + 0.5 * acceleration * dt * dt,
          )
          simState.entityManager.bullets.update(id, {
            currentSpeed: currentSpeed + acceleration * dt,
          })
        }
        break

      case BulletType.Mortar:
        {
          newPos = radialTranslate2(
            vec2.create(),
            transform.position,
            transform.orientation,
            bullet.currentSpeed! * dt,
          )

          if (nextLifetime >= MORTAR_TTL) {
            simState.entityManager.markForDeletion(id)
            simState.entityManager.register(makeExplosion(transform.position))
            return
          }
        }
        break
    }

    simState.entityManager.transforms.update(id, { position: newPos })
    simState.entityManager.bullets.update(id, { lifetime: nextLifetime })

    if (bullet.type !== BulletType.Mortar) {
      if (vec2.distance(newPos, bullet.origin) >= range[bullet.type]) {
        simState.entityManager.markForDeletion(id)
        return
      }
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
