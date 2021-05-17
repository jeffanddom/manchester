import { vec2 } from 'gl-matrix'

import { FrameState } from '~/simulate'

export const update = (simState: Pick<FrameState, 'entityManager'>): void => {
  for (const id of simState.entityManager.moveables) {
    const transform = simState.entityManager.transforms.get(id)!
    if (!vec2.equals(transform.position, transform.previousPosition)) {
      simState.entityManager.transforms.update(id, {
        previousPosition: vec2.clone(transform.position),
      })
    }
  }
}
