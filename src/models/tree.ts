import { TILE_SIZE } from '~/constants'
import { Model, ModelPrimitive } from '~/Model'

export const model: Model = {
  body: {
    primitive: ModelPrimitive.CIRCLE,
    radius: TILE_SIZE * 0.62,
    fillStyle: 'darkgreen',
  },
}
