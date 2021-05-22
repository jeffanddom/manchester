import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'

export const update = (simState: FrameState): void => {
  for (const id of simState.simState.moveables) {
    const transform = simState.simState.transforms.get(id)!
    if (!vec2.equals(transform.position, transform.previousPosition)) {
      simState.simState.transforms.update(id, {
        previousPosition: vec2.clone(transform.position),
      })
    }
  }
}
