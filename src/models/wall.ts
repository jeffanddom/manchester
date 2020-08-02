import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'
import { vec2FromValuesBatch } from '~/util/math'

export const model: Model = {
  body: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
    ]),
    fillStyle: 'rgba(130, 130, 130, 1)',
  },
}
