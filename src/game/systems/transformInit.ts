import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'

export const update = (frameState: FrameState): void => {
  for (const id of frameState.stateDb.moveables) {
    const transform = frameState.stateDb.transforms.get(id)!
    if (!vec2.equals(transform.position, transform.previousPosition)) {
      frameState.stateDb.transforms.update(id, {
        previousPosition: vec2.clone(transform.position),
      })
    }
  }
}
