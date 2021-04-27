import { vec2 } from 'gl-matrix'

import { DamageAreaType } from './damager'
import { FrameEventType } from './FrameEvent'

import * as transform from '~/components/Transform'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { SimState } from '~/simulate'
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

export function update(simState: SimState): void {
  for (const id of simState.entityManager.explosions) {
    simState.frameEvents.push({
      type: FrameEventType.MortarExplosion,
      position: vec2.clone(simState.entityManager.transforms.get(id)!.position),
    })
    simState.entityManager.markForDeletion(id)
  }
}
