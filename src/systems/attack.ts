import { mat4, quat, vec3, vec4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import { aabb as damageableAabb } from '~/components/Damageable'
import { aabb as damagerAabb } from '~/components/Damager'
import { DebugDrawObject } from '~/DebugDraw'
import { UnlitObjectType } from '~/renderer/Renderer3d'
import {
  SimState,
  SimulationPhase,
  simulationPhaseDebugColor,
} from '~/simulate'
import * as aabb2 from '~/util/aabb2'

export const update = (simState: SimState): void => {
  simState.debugDraw.draw3d(() => {
    const objects: DebugDrawObject[] = []

    for (const [entityId, d] of simState.entityManager.damageables) {
      const xform = simState.entityManager.transforms.get(entityId)!
      const [center, size] = aabb2.centerSize(damageableAabb(d, xform))
      objects.push({
        object: {
          type: UnlitObjectType.Model,
          modelName: 'linetile',
          model2World: mat4.fromRotationTranslationScale(
            mat4.create(),
            quat.create(),
            vec3.fromValues(center[0], 0.05, center[1]),
            vec3.fromValues(size[0], 1, size[1]),
          ),
          color: simulationPhaseDebugColor(vec4.create(), simState.phase),
        },
      })
    }

    return objects
  })

  for (const [id, damager] of simState.entityManager.damagers) {
    const transform = simState.entityManager.transforms.get(id)!
    const attackerAabb = damagerAabb(damager, transform)

    // simState.debugDraw.draw3d(() => {
    //   const [center, size] = aabb2.centerSize(attackerAabb)
    //   return [
    //     {
    //       object: {
    //         type: UnlitObjectType.Model,
    //         modelName: 'linetile',
    //         model2World: mat4.fromRotationTranslationScale(
    //           mat4.create(),
    //           quat.create(),
    //           vec3.fromValues(center[0], 0.05, center[1]),
    //           vec3.fromValues(size[0], 1, size[1]),
    //         ),
    //         color: simulationPhaseDebugColor(vec4.create(), simState.phase),
    //       },
    //       lifetime: 3,
    //     },
    //   ]
    // })

    const targetIds = simState.entityManager.queryByWorldPos(attackerAabb)
    const targetId = targetIds.find((damageableId) => {
      if (id === damageableId || damager.immuneList.includes(damageableId)) {
        return false
      }

      const damageable = simState.entityManager.damageables.get(damageableId)
      if (damageable === undefined) {
        return false
      }

      const targetTransform = simState.entityManager.transforms.get(
        damageableId,
      )!

      return aabb2.overlap(
        damageableAabb(damageable, targetTransform),
        attackerAabb,
      )
    })

    if (targetId === undefined) {
      continue
    }

    // For now, the only behavior for damagers is "bullet" style: apply
    // damage to the damageable, and then remove self from simulation.

    const damageable = simState.entityManager.damageables.get(targetId)!
    simState.entityManager.damageables.update(targetId, {
      health: damageable.health - damager.damageValue,
    })

    simState.entityManager.markForDeletion(id)

    // Knockback
    simState.frameEvents.push({
      type: FrameEventType.TankHit,
      entityId: targetId,
      hitAngle: transform.orientation,
    })

    simState.frameEvents.push({
      type: FrameEventType.BulletHit,
      position: vec2.clone(transform.position),
    })

    // Debug draw hits
    simState.debugDraw.draw3d(() => {
      if (simState.phase !== SimulationPhase.ClientAuthoritative) {
        return []
      }
      const damageableTransform = simState.entityManager.transforms.get(
        targetId,
      )!
      const [center, size] = aabb2.centerSize(
        damageableAabb(damageable, damageableTransform),
      )
      return [
        {
          object: {
            type: UnlitObjectType.Model,
            modelName: 'linetile',
            model2World: mat4.fromRotationTranslationScale(
              mat4.create(),
              quat.create(),
              vec3.fromValues(center[0], 0.05, center[1]),
              vec3.fromValues(size[0], 1, size[1]),
            ),
            color: vec4.fromValues(1, 0, 0, 1),
          },
          lifetime: 60,
        },
      ]
    })
  }
}
