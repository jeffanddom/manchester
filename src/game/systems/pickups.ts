import { GameStateDb } from '~/game/state/GameStateDb'

export enum PickupType {
  Core = 'Core',
  Wood = 'Wood',
}

export const update = (_stateDb: GameStateDb): void => {
  // const player = simState.getPlayer()!
  // const playerAabb = player.damageable!.aabb(player.transform!)
  // for (const [id, e] of simState.entities) {
  //   if (e.pickupType === undefined) {
  //     continue
  //   }
  //   const aabb = e.hitbox!.aabb(e.transform!.position)
  //   if (aabbOverlap(playerAabb, aabb)) {
  //     player.inventory!.push(e.pickupType)
  //     simState.markEntityForDeletion(e.id)
  //   }
  // }
}
