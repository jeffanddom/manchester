import { vec2 } from 'gl-matrix'

import { DamageAreaType } from './damager'
import { FrameEventType } from './FrameEvent'

import { FrameState } from '~/apps/game/simulate'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/engine/sim/EntityComponents'
import * as transform from '~/game/components/Transform'
import { Immutable } from '~/types/immutable'

export const makeExplosion = (pos: Immutable<vec2>): EntityComponents => {
  const e = makeDefaultEntity()

  e.explosion = true

  e.transform = transform.make()
  e.transform.position = vec2.clone(pos)

  e.damager = {
    damageValue: 5,
    area: {
      type: DamageAreaType.Circle,
      radius: 1,
    },
    splash: true,
    immuneList: [],
  }

  return e
}

export function update(simState: FrameState): void {
  for (const id of simState.simState.explosions) {
    simState.frameEvents.push({
      type: FrameEventType.MortarExplosion,
      position: vec2.clone(simState.simState.transforms.get(id)!.position),
    })
    simState.simState.markForDeletion(id)
  }
}
