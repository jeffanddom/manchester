import { mat2d, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { PickupModels } from '~/entities/pickup'
import { Game } from '~/Game'
import { Primitive } from '~/renderer/interfaces'

export const update = (g: Game): void => {
  const player = g.player
  if (!player) {
    return
  }

  const x = 50
  let y = 15

  player.inventory!.forEach((pickup) => {
    const model = PickupModels[pickup][0]

    g.renderer.render({
      primitive: Primitive.PATH,
      mwTransform: mat2d.translate(
        mat2d.create(),
        mat2d.identity(mat2d.create()),
        vec2.fromValues(x, y + TILE_SIZE / 2),
      ),
      path: model.path,
      fillStyle: model.fillStyle,
    })

    y += TILE_SIZE + 2
  })
}
