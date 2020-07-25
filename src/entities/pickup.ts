import { TILE_SIZE } from '~/constants'
import { vec2FromValuesBatch } from '~/util/math'

export enum PickupType {
  Core = 'Core',
}

export const PickupModels = {
  [PickupType.Core]: [
    {
      path: vec2FromValuesBatch([
        [0, -TILE_SIZE * 0.5],
        [TILE_SIZE * 0.5, 0],
        [0, TILE_SIZE * 0.5],
        [-TILE_SIZE * 0.5, 0],
      ]),
      fillStyle: 'blue',
    },
  ],
}
