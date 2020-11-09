import { vec2 } from 'gl-matrix'

import { SimState } from '~/simulate'

export const update = (simState: Pick<SimState, 'entityManager'>): void => {
  for (const id of simState.entityManager.moveables) {
    const transform = simState.entityManager.transforms.get(id)!
    if (!vec2.equals(transform.position, transform.previousPosition)) {
      const mutableTransform = simState.entityManager.transforms.checkpoint(id)!
      mutableTransform.previousPosition = vec2.clone(mutableTransform.position)
    }
  }
}
