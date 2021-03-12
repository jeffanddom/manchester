import { quat } from 'gl-matrix'
import { vec3 } from 'gl-matrix'

import { getGltfDocument } from '~/assets/models'
import {
  makeCubeModel,
  triModelAddEdgeOn,
  triModelToWiresolidLineModel,
} from '~/renderer/geometryUtils'
import * as gltf from '~/renderer/gltf'
import { MeshPrimitive, ModelNode } from '~/renderer/interfaces'
import { Renderer3d } from '~/renderer/Renderer3d'

function makeCubeComplex(): ModelNode {
  // positions for front face
  const nodes = [
    vec3.fromValues(-1, 1, 1), // NW
    vec3.fromValues(0, 1, 1), // N
    vec3.fromValues(1, 1, 1), // NE

    vec3.fromValues(-1, 0, 1), // W
    vec3.fromValues(0, 0, 1), // CENTER
    vec3.fromValues(1, 0, 1), // E

    vec3.fromValues(-1, -1, 1), // SW
    vec3.fromValues(0, -1, 1), // S
    vec3.fromValues(1, -1, 1), // SE
  ]

  // normal for front face
  const normal = vec3.fromValues(0, 0, 1)

  const faceRotations = [
    quat.create(), // front face
    quat.fromEuler(quat.create(), 180, 0, 0), // back face
    quat.fromEuler(quat.create(), 90, 0, 0), // bottom face
    quat.fromEuler(quat.create(), -90, 0, 0), // top face
    quat.fromEuler(quat.create(), 0, 90, 0), // right face
    quat.fromEuler(quat.create(), 0, -90, 0), // left face
  ]

  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let face = 0; face < faceRotations.length; face++) {
    const rot = faceRotations[face]
    const rotNodes = nodes.map((node) =>
      vec3.transformQuat(vec3.create(), node, rot),
    )
    const rotNormal = vec3.transformQuat(vec3.create(), normal, rot)

    for (const v of rotNodes) {
      positions.push(...v)
      normals.push(...rotNormal)
    }

    // Each face is a 2 x 2 set of quads
    const indexBase = face * 9
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        // Each quad has two tris
        indices.push(indexBase + (i * 3 + j))
        indices.push(indexBase + ((i + 1) * 3 + j))
        indices.push(indexBase + (i * 3 + j + 1))

        indices.push(indexBase + (i * 3 + j + 1))
        indices.push(indexBase + ((i + 1) * 3 + j))
        indices.push(indexBase + ((i + 1) * 3 + j + 1))
      }
    }
  }

  return {
    name: 'cube',
    meshes: [
      {
        primitive: MeshPrimitive.Triangles,
        positions: {
          bufferData: new Float32Array(positions),
          componentsPerAttrib: 3,
        },
        normals: {
          bufferData: new Float32Array(normals),
          componentsPerAttrib: 3,
        },
        indices: {
          bufferData: new Uint16Array(indices),
          componentsPerAttrib: 1,
        },
      },
    ],
    children: [],
  }
}

export function load(renderer: Renderer3d): void {
  const tank = gltf.getModels(getGltfDocument('tank'))[0]
  renderer.loadModel('tank', triModelAddEdgeOn(tank))
  renderer.loadModel('tank-line', triModelToWiresolidLineModel(tank))

  const shiba = gltf.getModels(getGltfDocument('shiba'))[0]
  renderer.loadModel('shiba', triModelAddEdgeOn(shiba))
  renderer.loadModel('shiba-line', triModelToWiresolidLineModel(shiba))

  const turret = gltf.getModels(getGltfDocument('turret'))[0]
  renderer.loadModel('turret', triModelAddEdgeOn(turret))
  renderer.loadModel('turret-line', triModelToWiresolidLineModel(turret))

  const cubeBasic = makeCubeModel()
  renderer.loadModel('cubeBasic', triModelAddEdgeOn(cubeBasic))
  renderer.loadModel('cubeBasic-line', triModelToWiresolidLineModel(cubeBasic))

  const cubeComplex = makeCubeComplex()
  renderer.loadModel('cubeComplex', triModelAddEdgeOn(cubeComplex))
  renderer.loadModel(
    'cubeComplex-line',
    triModelToWiresolidLineModel(cubeComplex),
  )
}
