import { emitters } from './emitters'
import { maps } from './maps'

import { BasicEmitterSettings } from '~/engine/particles/emitters/BasicEmitter'
import { RawMap } from '~/game/map/interfaces'
import { Immutable } from '~/types/immutable'

export const CommonAssets: {
  readonly emitters: Map<string, Immutable<BasicEmitterSettings>[]>
  readonly maps: Map<string, RawMap>
} = {
  emitters,
  maps,
}
