import { mat2d, vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { PickupModels } from '~/entities/pickup'
import { Primitive } from '~/renderer/interfaces'

export const update = (c: Client, player: Entity): void => {
  if (!player) {
    return
  }

  const x = 50
  let y = 15

  player.inventory!.forEach((pickup) => {
    const model = PickupModels[pickup][0]

    c.renderer.render({
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
