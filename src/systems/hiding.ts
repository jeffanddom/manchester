import { Game } from '~/Game'
import { aabbOverlapArea } from '~/util/math'

const REQUIRED_OVERLAP = 0.5

export const update = (g: Game): void => {
  const obscurings = Object.values(g.entities.entities).filter(
    (e) => e.hitbox && e.obscuring,
  )

  const player = g.player!
  player.obscured = false
  const playerArea = player.hitbox!.dimensions[0] * player.hitbox!.dimensions[1]
  let overlap = 0

  for (const i in obscurings) {
    const o = obscurings[i]
    overlap +=
      aabbOverlapArea(
        o.hitbox!.aabb(o.transform!.position, o.transform!.orientation),
        player.hitbox!.aabb(
          player.transform!.position,
          player.transform!.orientation,
        ),
      ) / playerArea

    if (overlap > REQUIRED_OVERLAP) {
      player.obscured = true
      return
    }
  }
}
