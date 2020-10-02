import { vec2 } from 'gl-matrix'

import { SimState } from '~/simulate'

export const update = (simState: Pick<SimState, 'entityManager'>): void => {
  for (const id in simState.entityManager.entities) {
    const e = simState.entityManager.entities[id]
    if (!e.transform) {
      continue
    }

    if (!vec2.equals(e.transform.position, e.transform.previousPosition)) {
      simState.entityManager.checkpoint(id)
      e.transform.previousPosition = vec2.clone(e.transform.position)
    }
  }
}
