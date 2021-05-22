import { SimState } from '~/engine/sim/SimState'

export enum PickupType {
  Core = 'Core',
  Wood = 'Wood',
}

export const update = (_simState: SimState): void => {
  // const player = simState.getPlayer()!
  // const playerAabb = player.damageable!.aabb(player.transform!)
  // for (const [id, e] of simState.entities) {
  //   if (e.pickupType === undefined) {
  //     continue
  //   }
  //   const aabb = e.hitbox!.aabb(e.transform!.position)
  //   if (aabbOverlap(playerAabb, aabb)) {
  //     player.inventory!.push(e.pickupType)
  //     simState.markForDeletion(e.id)
  //   }
  // }
}
