import { Game } from '~/Game'
import { aabbOverlap } from '~/util/math'

export enum PickupType {
  Core = 'Core',
  Wood = 'Wood',
}

export const update = (g: Game): void => {
  const player = g.player!
  const playerAabb = player.damageable!.aabb(player.transform!)

  for (const id in g.serverEntityManager.entities) {
    const e = g.serverEntityManager.entities[id]
    if (e.pickupType === undefined) {
      continue
    }

    const aabb = e.hitbox!.aabb(e.transform!.position)

    if (aabbOverlap(playerAabb, aabb)) {
      player.inventory!.push(e.pickupType)
      g.serverEntityManager.markForDeletion(e.id)
    }
  }
}
