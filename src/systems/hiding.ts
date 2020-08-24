import { Team } from '~/components/team'
import { Game } from '~/Game'
import { aabbOverlapArea } from '~/util/math'

const REQUIRED_OVERLAP = 0.5

export const update = (g: Game): void => {
  const obscurings = Object.values(g.serverEntityManager.entities).filter(
    (e) => e.hitbox && e.obscuring,
  )

  const hideables = Object.values(g.serverEntityManager.entities).filter(
    (e) => !!e.transform && !!e.hitbox && e.team === Team.Friendly,
  )

  for (const check of hideables) {
    check.obscured = false
    const checkArea = check.hitbox!.dimensions[0] * check.hitbox!.dimensions[1]
    let overlap = 0

    for (const i in obscurings) {
      const o = obscurings[i]
      overlap +=
        aabbOverlapArea(
          o.hitbox!.aabb(o.transform!.position),
          check.hitbox!.aabb(check.transform!.position),
        ) / checkArea

      if (overlap > REQUIRED_OVERLAP) {
        check.obscured = true
        break
      }
    }
  }
}
