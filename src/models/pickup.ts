import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'
import { vec2FromValuesBatch } from '~/util/math'

export const model: Model = {
  body: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, 0],
      [0, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.5, 0],
    ]),
    fillStyle: 'blue',
  },
}

export const modelWood: Model = {
  body: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.5, 0],
      [0, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.5, 0],
    ]),
    fillStyle: 'brown',
  },
}
