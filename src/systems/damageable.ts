import { vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import { PickupConstructors } from '~/entities/pickups'
import { FrameState } from '~/simulate'

export const update = (simState: FrameState): void => {
  for (const [id, damageable] of simState.simState.damageables) {
    const transform = simState.simState.transforms.get(id)!

    if (damageable.health <= 0) {
      const dropType = simState.simState.dropTypes.get(id)
      if (dropType !== undefined) {
        const core = PickupConstructors[dropType]()
        core.transform!.position = vec2.clone(transform.position)
        simState.simState.register(core)
      }
      simState.simState.markForDeletion(id)

      simState.frameEvents.push({
        type: FrameEventType.EntityDestroyed,
        position: vec2.clone(transform.position),
      })
    }
  }
}
