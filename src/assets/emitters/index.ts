import bulletExplosion from './bulletExplosion.json'
import entityExplosion from './entityExplosion.json'
import tankShot from './tankShot.json'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { Immutable } from '~/types/immutable'
import { deepRehydrateFloat32Arrays } from '~/util/convert'

export const emitters: Map<string, Immutable<BasicEmitterSettings>[]> = new Map(
  Object.entries({
    bulletExplosion: deepRehydrateFloat32Arrays(
      bulletExplosion,
    ) as BasicEmitterSettings[],
    entityExplosion: deepRehydrateFloat32Arrays(
      entityExplosion,
    ) as BasicEmitterSettings[],
    tankShot: deepRehydrateFloat32Arrays(tankShot) as BasicEmitterSettings[],
  }),
)
