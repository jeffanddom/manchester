import { models } from './models'

import * as gltf from '~/renderer/gltf'

export const ClientAssets: {
  readonly models: Map<string, gltf.Document>
} = {
  models,
}
