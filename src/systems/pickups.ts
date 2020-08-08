import { Game } from '~/Game'
import { aabbOverlap } from '~/util/math'

export enum PickupType {
  Core = 'Core',
}

export const update = (g: Game): void => {
  const player = g.player!
  const playerAabb = player.damageable!.aabb(player.transform!)

  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (e.pickupType === undefined) {
      continue
    }

    const aabb = e.hitbox!.aabb(e.transform!.position, e.transform!.orientation)

    if (aabbOverlap(playerAabb, aabb)) {
      player.inventory!.push(e.pickupType)
      g.entities.markForDeletion(e.id)
    }
  }
}
