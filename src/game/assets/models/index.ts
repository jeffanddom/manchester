import bulletGltf from './bullet.gltf'
import coreGltf from './core.gltf'
import mortarGltf from './mortar.gltf'
import shibaGltf from './shiba.gltf'
import sphereGltf from './sphere.gltf'
import tankGltf from './tank.gltf'
import treeGltf from './tree.gltf'
import turretGltf from './turret.gltf'
import wallGltf from './wall.gltf'

import * as gltf from '~/engine/renderer/gltf'

export const models: Map<string, gltf.Document> = new Map(
  Object.entries({
    bullet: bulletGltf as gltf.Document,
    core: coreGltf as gltf.Document,
    mortar: mortarGltf as gltf.Document,
    shiba: shibaGltf as gltf.Document,
    sphere: sphereGltf as gltf.Document,
    tank: tankGltf as gltf.Document,
    tree: treeGltf as gltf.Document,
    turret: turretGltf as gltf.Document,
    wall: wallGltf as gltf.Document,
  }),
)
