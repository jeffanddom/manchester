import { TILE_SIZE } from '~/constants'
import { PickupType } from '~/systems/pickups'
import { vec2FromValuesBatch } from '~/util/math'

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
