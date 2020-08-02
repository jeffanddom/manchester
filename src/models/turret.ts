import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'
import { vec2FromValuesBatch } from '~/util/math'

export const model: Model = {
  base: {
    primitive: ModelPrimitive.CIRCLE,
    radius: TILE_SIZE * 0.45,
    fillStyle: 'grey',
  },
  gun: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [-TILE_SIZE * 0.1, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.2, TILE_SIZE * 0.3],
      [-TILE_SIZE * 0.2, TILE_SIZE * 0.3],
    ]),
    fillStyle: 'yellow',
  },
}
