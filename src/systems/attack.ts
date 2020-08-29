import { vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { ITransform } from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { Game } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive } from '~/renderer/interfaces'
import { aabbOverlap, radialTranslate2 } from '~/util/math'

export const update = (g: Game, entityManager: EntityManager): void => {
  const damagers: [string, Damager, ITransform][] = []
  const damageables: [string, Damageable, ITransform][] = []

  for (const id in entityManager.entities) {
    const e = entityManager.entities[id]
    if (!e.transform) {
      continue
    }

    if (e.damager) {
      damagers.push([e.id, e.damager, e.transform])
    }

    if (e.damageable) {
      damageables.push([e.id, e.damageable, e.transform])
    }
  }

  for (const i in damagers) {
    const [attackerId, damager, attackerTransform] = damagers[i]
    const attackerAabb = damager.aabb(attackerTransform)

    g.debugDraw(() => {
      const d = vec2.sub(vec2.create(), attackerAabb[1], attackerAabb[0])
      return [
        {
          primitive: Primitive.RECT,
          strokeStyle: 'black',
          pos: attackerAabb[0],
          dimensions: d,
        },
      ]
    })

    const hit = damageables.find(
      ([targetId, damageable, targetTransform]) =>
        attackerId !== targetId &&
        !damager.immuneList.includes(targetId) &&
        aabbOverlap(damageable.aabb(targetTransform), attackerAabb),
    )
    if (!hit) {
      continue
    }

    const [targetId, damageable] = hit

    // For now, the only behavior for damagers is "bullet" style: apply
    // damage to the damageable, and then remove self from simulation.

    // TODO: change to hit event for damageable system
    damageable.health -= damager.damageValue

    // TODO: client and server both delete their own bullets
    entityManager.markForDeletion(attackerId)

    // ---------------------

    // Client only side-effects:
    // - explosion
    // - camera shake if player hit
    const explosion = new ParticleEmitter({
      spawnTtl: 0.2,
      position: radialTranslate2(
        vec2.create(),
        attackerTransform.position,
        attackerTransform.orientation,
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
    g.client.emitters.push(explosion)

    const player = entityManager.getPlayer()
    if (player && player.id === targetId) {
      g.client.camera.shake()
    }
  }
}
