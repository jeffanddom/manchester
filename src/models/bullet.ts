import { Model, ModelPrimitive } from '~/Model'
import { vec2FromValuesBatch } from '~/util/math'

export const model: Model = {
  body: {
    primitive: ModelPrimitive.PATH,
    path: vec2FromValuesBatch([
      [-2, -2],
      [2, -2],
      [2, 2],
      [-2, 2],
    ]),
    fillStyle: 'red',
  },
}
