import { models } from './models'

import * as gltf from '~/engine/renderer/gltf'

export const ClientAssets: {
  readonly models: Map<string, gltf.Document>
} = {
  models,
}
