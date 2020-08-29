import { EntityManager } from '~/entities/EntityManager'
import { Game } from '~/Game'
import { aabbOverlap } from '~/util/math'

export enum PickupType {
  Core = 'Core',
  Wood = 'Wood',
}

export const update = (g: Game, entityManager: EntityManager): void => {
  const player = entityManager.getPlayer()!
  const playerAabb = player.damageable!.aabb(player.transform!)

  for (const id in entityManager.entities) {
    const e = entityManager.entities[id]
    if (e.pickupType === undefined) {
      continue
    }

    const aabb = e.hitbox!.aabb(e.transform!.position)

    if (aabbOverlap(playerAabb, aabb)) {
      player.inventory!.push(e.pickupType)
      entityManager.markForDeletion(e.id)
    }
  }
}
