import { vec2 } from 'gl-matrix'

import { aabb as damageableAabb } from '~/components/Damageable'
import { aabb as damagerAabb } from '~/components/Damager'
import { TILE_SIZE } from '~/constants'
import { EntityId } from '~/entities/EntityId'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { aabbOverlap, radialTranslate2 } from '~/util/math'

export const update = (
  simState: Pick<
    SimState,
    'entityManager' | 'registerParticleEmitter' | 'frame'
  >,
): void => {
  for (const [id, damager] of simState.entityManager.damagers) {
    const transform = simState.entityManager.transforms.get(id)!
    const attackerAabb = damagerAabb(damager, transform)
    const targetIds = simState.entityManager.queryByWorldPos(attackerAabb)

    let targetId: EntityId | undefined
    if (targetIds) {
      targetId = targetIds.find((damageableId) => {
        if (id === damageableId || damager.immuneList.includes(damageableId)) {
          return false
        }

        const damageable = simState.entityManager.damageables.get(damageableId)
        if (!damageable) {
          return false
        }

        const targetTransform = simState.entityManager.transforms.get(
          damageableId,
        )!

        return aabbOverlap(
          damageableAabb(damageable, targetTransform),
          attackerAabb,
        )
      })
    }

    if (!targetId) {
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
    if (simState.registerParticleEmitter) {
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
