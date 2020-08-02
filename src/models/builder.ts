import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'
import { vec2FromValuesBatch } from '~/util/math'

export const model: Model = {
  body: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.25],
      [TILE_SIZE * 0.25, 0],
      [0, TILE_SIZE * 0.25],
      [-TILE_SIZE * 0.25, 0],
    ]),
    fillStyle: 'purple',
  },
}
