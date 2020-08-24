import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 6)

export const update = (g: Game, dt: number): void => {
  for (const id in g.serverEntityManager.entities) {
    const e = g.serverEntityManager.entities[id]
    if (!e.bullet) {
      continue
    }

    radialTranslate2(
      e.transform!.position,
      e.transform!.position,
      e.transform!.orientation,
      BULLET_SPEED * dt,
    )

    if (
      vec2.distance(e.transform!.position, e.bullet.origin) >= e.bullet.range
    ) {
      g.serverEntityManager.markForDeletion(id)
      return
    }
  }
}
