import bulletExplosion from './bulletExplosion.json'
import entityExplosion from './entityExplosion.json'
import fallingLeaves from './fallingLeaves.json'
import tankShot from './tankShot.json'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { Immutable } from '~/types/immutable'
import { deepRehydrateFloat32Arrays } from '~/util/convert'

const raw: Record<string, unknown> = {
  bulletExplosion,
  entityExplosion,
  fallingLeaves,
  tankShot,
}

const record = Object.keys(raw).reduce((accum, k) => {
  accum[k] = deepRehydrateFloat32Arrays(raw[k]) as BasicEmitterSettings[]
  return accum
}, {} as Record<string, BasicEmitterSettings[]>)

export const emitters: Map<string, Immutable<BasicEmitterSettings>[]> = new Map(
  Object.entries(record),
)
