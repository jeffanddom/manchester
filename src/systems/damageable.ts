import { vec2 } from 'gl-matrix'

import { PickupConstructors } from '~/entities/pickups'
import { SimState } from '~/simulate'

export const update = (simState: SimState): void => {
  for (const [id, damageable] of simState.entityManager.damageables) {
    const transform = simState.entityManager.transforms.get(id)!

    if (damageable.health <= 0) {
      const dropType = simState.entityManager.dropTypes.get(id)
      if (dropType !== undefined) {
        const core = PickupConstructors[dropType]()
        core.transform!.position = vec2.clone(transform.position)
        simState.entityManager.register(core)
      }
      simState.entityManager.markForDeletion(id)
    }
  }
}
