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

export function update(stateDb: FrameState): void {
  for (const id of stateDb.stateDb.explosions) {
    stateDb.frameEvents.push({
      type: FrameEventType.MortarExplosion,
      position: vec2.clone(stateDb.stateDb.transforms.get(id)!.position),
    })
    stateDb.stateDb.markEntityForDeletion(id)
  }
}
