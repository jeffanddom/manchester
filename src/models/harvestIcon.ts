import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'

export const model: Model = {
  cross1: {
    primitive: ModelPrimitive.LINE,
    from: vec2.fromValues(-TILE_SIZE / 4, -TILE_SIZE / 4),
    to: vec2.fromValues(TILE_SIZE / 4, TILE_SIZE / 4),
    width: 3,
    style: 'blue',
  },
  cross2: {
    primitive: ModelPrimitive.LINE,
    from: vec2.fromValues(-TILE_SIZE / 4, TILE_SIZE / 4),
    to: vec2.fromValues(TILE_SIZE / 4, -TILE_SIZE / 4),
    width: 3,
    style: 'blue',
  },
}
