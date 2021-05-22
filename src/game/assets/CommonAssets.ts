import { emitters } from './emitters'
import { maps } from './maps'

import { RawMap } from '~/engine/map/interfaces'
import { BasicEmitterSettings } from '~/engine/particles/emitters/BasicEmitter'
import { Immutable } from '~/types/immutable'

export const CommonAssets: {
  readonly emitters: Map<string, Immutable<BasicEmitterSettings>[]>
  readonly maps: Map<string, RawMap>
} = {
  emitters,
  maps,
}
