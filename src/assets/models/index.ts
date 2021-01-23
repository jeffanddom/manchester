import bulletObj from '~/assets/models/bullet.obj'
import coreObj from '~/assets/models/core.obj'
import sphereGltf from '~/assets/models/sphere.gltf'
import tankGltf from '~/assets/models/tank.gltf'
import treeObj from '~/assets/models/tree.obj'
import turretGltf from '~/assets/models/turret.gltf'
import wallObj from '~/assets/models/wall.obj'
import * as gltf from '~/renderer/gltf'
import { ModelDef, ModelPrimitive } from '~/renderer/interfaces'

const models: {
  [key: string]: string
} = {
  bullet: bulletObj,
  core: coreObj,
  tree: treeObj,
  wall: wallObj,
}

export const gltfs: Map<string, gltf.Document> = new Map(
  Object.entries({
    sphere: sphereGltf as gltf.Document,
    tank: tankGltf as gltf.Document,
    turret: turretGltf as gltf.Document,
  }),
)

const materials = new Map<string, [number, number, number, number]>(
  Object.entries({
    bullet: [1.0, 0, 0, 1.0],
    core: [1.0, 0.5, 0, 1.0],
    debug: [0, 1.0, 1.0, 1.0],
    tank: [0, 0, 0, 1.0],
    tree: [0, 100 / 255, 0, 1.0],
    turret: [1.0, 250 / 255, 205 / 255, 1.0],
    wall: [169 / 255, 169 / 255, 169 / 255, 1.0],
  }),
)

type ModelTypes = keyof typeof models

const defaultColor = [1.0, 0, 1.0, 1.0]

export const parseObj: (modelType: ModelTypes) => ModelDef = (modelType) => {
  const obj = models[modelType]

  const vertices: number[] = []
  const colors: number[] = []
  const normals: number[] = []

  const objVerts: number[][] = []
  const objNormals: number[][] = []

  let currentColor = defaultColor
  obj.split('\n').forEach((line) => {
    if (line.length === 0) {
      return
    }

    const components = line.split(/\s+/)

    if (components[0] === 'v') {
      objVerts.push([
        parseFloat(components[1]),
        parseFloat(components[2]),
        parseFloat(components[3]),
      ])
    }

    if (components[0] === 'vn') {
      objNormals.push([
        parseFloat(components[1]),
        parseFloat(components[2]),
        parseFloat(components[3]),
      ])
    }

    if (components[0] === 'usemtl') {
      currentColor = materials.get(components[1]) ?? defaultColor
    }

    if (components[0] === 'f') {
      const splitDefs = components
        .slice(1)
        .map((def) => def.split('/').map((n) => parseInt(n) - 1))
      const vertIndices = splitDefs.map((def) => def[0])
      const normIndices =
        line.indexOf('/') > -1 ? splitDefs.map((def) => def[2]) : []

      vertices.push(
        ...objVerts[vertIndices[0]],
        ...objVerts[vertIndices[1]],
        ...objVerts[vertIndices[2]],
      )

      colors.push(
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
      )

      if (normIndices.length > 0) {
        normals.push(
          ...objNormals[normIndices[0]],
          ...objNormals[normIndices[1]],
          ...objNormals[normIndices[2]],
        )
      }
    }
  })

  return {
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    normals: new Float32Array(normals),
    primitive: ModelPrimitive.Triangles,
  }
}

export function getGltfDocument(name: string): gltf.Document {
  const doc = gltfs.get(name)
  if (doc === undefined) {
    throw new Error(`no GLTF named ${name}`)
  }
  return doc
}
