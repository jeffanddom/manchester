import tankShot from './tankShot.json'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { Immutable } from '~/types/immutable'
import { deepRehydrateFloat32Arrays } from '~/util/convert'

export const emitters: Map<string, Immutable<BasicEmitterSettings>[]> = new Map(
  Object.entries({
    tankShot: deepRehydrateFloat32Arrays(tankShot) as BasicEmitterSettings[],
  }),
)
