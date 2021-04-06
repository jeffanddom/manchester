import { emitters } from './emitters'
import { models } from './models'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import * as gltf from '~/renderer/gltf'
import { Immutable } from '~/types/immutable'

export const ClientAssets: {
  readonly emitters: Map<string, Immutable<BasicEmitterSettings>[]>
  readonly models: Map<string, gltf.Document>
} = {
  emitters,
  models,
}
