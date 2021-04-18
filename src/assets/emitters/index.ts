import bulletExplosion from './bulletExplosion.json'
import entityExplosion from './entityExplosion.json'
import fallingLeaves from './fallingLeaves.json'
import rocketExhaust from './rocketExhaust.json'
import tankShot from './tankShot.json'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { Immutable } from '~/types/immutable'
import { deepRehydrateFloat32Arrays } from '~/util/convert'

const raw: Record<string, unknown> = {
  bulletExplosion,
  entityExplosion,
  fallingLeaves,
  rocketExhaust,
  tankShot,
}

const entries: [string, Immutable<BasicEmitterSettings>[]][] = Object.keys(
  raw,
).map((k) => [
  k,
  deepRehydrateFloat32Arrays(raw[k]) as Immutable<BasicEmitterSettings>[],
])

export const emitters = new Map(entries)
