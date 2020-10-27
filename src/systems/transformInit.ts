import { vec2 } from 'gl-matrix'

import { SimState } from '~/simulate'

export const update = (simState: Pick<SimState, 'entityManager'>): void => {
  for (const id of simState.entityManager.moveables) {
    const transform = simState.entityManager.entities.get(id)!.transform!

    if (!vec2.equals(transform.position, transform.previousPosition)) {
      transform.previousPosition = vec2.clone(transform.position)
    }
  }
}
