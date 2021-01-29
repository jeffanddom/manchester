import bulletGltf from '~/assets/models/bullet.gltf'
import coreGltf from '~/assets/models/core.gltf'
import sphereGltf from '~/assets/models/sphere.gltf'
import tankGltf from '~/assets/models/tank.gltf'
import treeGltf from '~/assets/models/tree.gltf'
import turretGltf from '~/assets/models/turret.gltf'
import wallGltf from '~/assets/models/wall.gltf'
import * as gltf from '~/renderer/gltf'

export const gltfs: Map<string, gltf.Document> = new Map(
  Object.entries({
    bullet: bulletGltf as gltf.Document,
    core: coreGltf as gltf.Document,
    sphere: sphereGltf as gltf.Document,
    tank: tankGltf as gltf.Document,
    tree: treeGltf as gltf.Document,
    turret: turretGltf as gltf.Document,
    wall: wallGltf as gltf.Document,
  }),
)

export function getGltfDocument(name: string): gltf.Document {
  const doc = gltfs.get(name)
  if (doc === undefined) {
    throw new Error(`no GLTF named ${name}`)
  }
  return doc
}
