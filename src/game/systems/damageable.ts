import { vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import { PickupConstructors } from '~/game/entities/pickups'
import { FrameState } from '~/game/updateSystems'

export const update = (frameState: FrameState): void => {
  for (const [id, damageable] of frameState.stateDb.damageables) {
    const transform = frameState.stateDb.transforms.get(id)!

    if (damageable.health <= 0) {
      const dropType = frameState.stateDb.dropTypes.get(id)
      if (dropType !== undefined) {
        const core = PickupConstructors[dropType]()
        core.transform!.position = vec2.clone(transform.position)
        frameState.stateDb.registerEntity(core)
      }
      frameState.stateDb.markEntityForDeletion(id)

      frameState.frameEvents.push({
        type: FrameEventType.EntityDestroyed,
        position: vec2.clone(transform.position),
      })
    }
  }
}
