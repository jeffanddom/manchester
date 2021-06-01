import { gltfs } from './gltfs'

import * as gltf from '~/engine/renderer/gltf'

export const ClientAssets: {
  readonly gltfs: Map<string, gltf.Document>
} = {
  gltfs: gltfs,
}
