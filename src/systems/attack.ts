import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { aabb as damageableAabb } from '~/components/Damageable'
import { aabb as damagerAabb } from '~/components/Damager'
import { TILE_SIZE } from '~/constants'
import { DebugDrawObject } from '~/DebugDraw'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { UnlitObjectType } from '~/renderer/Renderer3d'
import { SimState, simulationPhaseDebugColor } from '~/simulate'
import * as aabb2 from '~/util/aabb2'
import { radialTranslate2 } from '~/util/math'

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

    simState.debugDraw.draw3d(() => {
      const [center, size] = aabb2.centerSize(attackerAabb)
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
            color: simulationPhaseDebugColor(vec4.create(), simState.phase),
          },
          lifetime: 3,
        },
      ]
    })

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

    // ---------------------

    // Client only side-effects:
    // - explosion
    // - camera shake if player hit
    if (simState.registerParticleEmitter !== undefined) {
      const explosion = new ParticleEmitter({
        spawnTtl: 0.2,
        position: radialTranslate2(
          vec2.create(),
          transform.position,
          transform.orientation,
          TILE_SIZE / 2,
        ),
        particleTtl: 0.1,
        particleRadius: 10,
        particleSpeedRange: [90, 125],
        particleRate: 270,
        orientation: 0,
        arc: Math.PI * 2,
        colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
      })
      simState.registerParticleEmitter({
        emitter: explosion,
        entity: targetId,
        frame: simState.frame,
      })
    }
  }
}
