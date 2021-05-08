import { mat4, quat, vec2, vec3 } from 'gl-matrix'

import { makeExplosion } from './explosion'

import { BulletType } from '~/components/Bullet'
import { MORTAR_FIRING_HEIGHT, MORTAR_GRAVITY, TILE_SIZE } from '~/constants'
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
          const disp = vec3.scale(vec3.create(), bullet.vel!, dt)
          disp[1] += 0.5 * MORTAR_GRAVITY * dt * dt

          const transform3 = simState.entityManager.transform3s.get(id)!
          const newPos3 = vec3.clone(transform3.position)
          vec3.add(newPos3, newPos3, disp)

          if (newPos3[1] <= MORTAR_FIRING_HEIGHT) {
            simState.entityManager.markForDeletion(id)
            simState.entityManager.register(makeExplosion(transform.position))
            return
          }

          // Calculate bullet orientation
          const vDir = vec3.create()
          vec3.normalize(vDir, bullet.vel!)

          const vRight = vec3.create()
          vec3.cross(vRight, vDir, PlusY3)
          vec3.normalize(vRight, vRight)

          const vForward = vec3.create()
          vec3.cross(vForward, PlusY3, vRight)
          vec3.normalize(vForward, vForward)

          let angle = Math.acos(vec3.dot(vForward, vDir))
          if (vDir[1] < 0) {
            angle = -angle
          }

          simState.entityManager.transform3s.update(id, {
            position: newPos3,
            orientation: quat.setAxisAngle(quat.create(), vRight, angle),
          })

          const newVel = vec3.clone(bullet.vel!)
          newVel[1] += MORTAR_GRAVITY * dt
          simState.entityManager.bullets.update(id, { vel: newVel })

          // Use some fake 2d value
          newPos = vec2.fromValues(newPos3[0], newPos3[2])
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
