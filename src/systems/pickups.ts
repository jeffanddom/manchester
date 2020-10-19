import { EntityManager } from '~/entities/EntityManager'

export enum PickupType {
  Core = 'Core',
  Wood = 'Wood',
}

export const update = (_entityManager: EntityManager): void => {
  // const player = entityManager.getPlayer()!
  // const playerAabb = player.damageable!.aabb(player.transform!)
  // for (const id in entityManager.entities) {
  //   const e = entityManager.entities[id]
  //   if (e.pickupType === undefined) {
  //     continue
  //   }
  //   const aabb = e.hitbox!.aabb(e.transform!.position)
  //   if (aabbOverlap(playerAabb, aabb)) {
  //     player.inventory!.push(e.pickupType)
  //     entityManager.markForDeletion(e.id)
  //   }
  // }
}
