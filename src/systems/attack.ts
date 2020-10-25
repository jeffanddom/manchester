import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { aabbOverlap, radialTranslate2 } from '~/util/math'

export const update = (
  simState: Pick<SimState, 'entityManager' | 'registerParticleEmitter'>,
): void => {
  const damagers: Entity[] = []
  for (const [, e] of simState.entityManager.entities) {
    if (e.damager) {
      damagers.push(e)
    }
  }

  for (const index in damagers) {
    const d = damagers[index]
    const attackerAabb = d.damager!.aabb(d.transform!)
    const damageableIds = simState.entityManager.querySpatialIndex(attackerAabb)

    let hit: Entity | undefined
    if (damageableIds) {
      const hitId = damageableIds.find((damageableId) => {
        const other = simState.entityManager.entities.get(damageableId)

        return (
          d.id !== damageableId &&
          !d.damager!.immuneList.includes(damageableId) &&
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
    damageable.health -= d.damager!.damageValue

    // TODO: client and server both delete their own bullets
    simState.entityManager.markForDeletion(d.id)

    // ---------------------

    // Client only side-effects:
    // - explosion
    // - camera shake if player hit
    if (simState.registerParticleEmitter) {
      const explosion = new ParticleEmitter({
        spawnTtl: 0.2,
        position: radialTranslate2(
          vec2.create(),
          d.transform!.position,
          d.transform!.orientation,
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
      })
    }

    // const player = simState.entityManager.getPlayer()
    // if (player && player.id === targetId) {
    //   g.client.camera.shake()
    // }
  }
}
