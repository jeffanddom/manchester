import { vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import { PickupConstructors } from '~/entities/pickups'
import { FrameState } from '~/simulate'

export const update = (simState: FrameState): void => {
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

      simState.frameEvents.push({
        type: FrameEventType.EntityDestroyed,
        position: vec2.clone(transform.position),
      })
    }
  }
}
