import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { aabbOverlap, radialTranslate2 } from '~/util/math'

export const update = (
  simState: Pick<
    SimState,
    'entityManager' | 'registerParticleEmitter' | 'frame'
  >,
): void => {
  for (const id of simState.entityManager.damagers) {
    const e = simState.entityManager.entities.get(id)!
    const attackerAabb = e.damager!.aabb(e.transform!)
    const damageableIds = simState.entityManager.queryByWorldPos(attackerAabb)

    let hit: Entity | undefined
    if (damageableIds) {
      const hitId = damageableIds.find((damageableId) => {
        const other = simState.entityManager.entities.get(damageableId)

        return (
          e.id !== damageableId &&
          !e.damager!.immuneList.includes(damageableId) &&
          other && // query includes deleted entities
          other.damageable && // query includes non-damageables
          aabbOverlap(other.damageable.aabb(other.transform!), attackerAabb)
        )
      })

      if (hitId) {
        hit = simState.entityManager.entities.get(hitId)
      }
    }

    if (!hit) {
      continue
    }

    const targetId = hit.id
    const damageable = hit.damageable!
    simState.entityManager.checkpoint(targetId)

    // For now, the only behavior for damagers is "bullet" style: apply
    // damage to the damageable, and then remove self from simulation.

    // TODO: change to hit event for damageable system
    damageable.health -= e.damager!.damageValue

    // TODO: client and server both delete their own bullets
    simState.entityManager.markForDeletion(e.id)

    // ---------------------

    // Client only side-effects:
    // - explosion
    // - camera shake if player hit
    if (simState.registerParticleEmitter) {
      const explosion = new ParticleEmitter({
        spawnTtl: 0.2,
        position: radialTranslate2(
          vec2.create(),
          e.transform!.position,
          e.transform!.orientation,
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

    // const player = simState.entityManager.getPlayer()
    // if (player && player.id === targetId) {
    //   g.client.camera.shake()
    // }
  }
}
