import { vec2 } from 'gl-matrix'

import { Game } from '~/Game'
import { Primitive } from '~/renderer/interfaces'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    const transform = e.transform
    const damagerLogic = e.damagerLogic
    if (!transform || !damagerLogic) {
      continue
    }

    damagerLogic.update(transform, id, g)

    g.debugDraw(() => {
      const aabb = damagerLogic.aabb(transform)
      const d = vec2.sub(vec2.create(), aabb[1], aabb[0])

      return {
        primitive: Primitive.RECT,
        strokeStyle: 'magenta',
        pos: aabb[0],
        dimensions: d,
      }
    })
  }
}
