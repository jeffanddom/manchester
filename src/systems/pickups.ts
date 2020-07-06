import { Game } from '~/Game'
import { aabbOverlap } from '~/util/math'

export const update = (g: Game): void => {
  const player = g.player.unwrap()
  const playerAabb = player.damageable!.aabb(player.transform!)

  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.pickupScript) {
      continue
    }

    const aabb = e.pickupScript!.aabb(e.transform!)

    if (aabbOverlap(playerAabb, aabb)) {
      e.pickupScript.update(g)
      g.entities.markForDeletion(e.id)
    }
  }
}
