import { mat4 } from 'gl-matrix'

import {
  BufferArray,
  DataMesh,
  LineMesh,
  MeshPrimitive,
  ModelNode,
  TriangleMesh,
} from './interfaces'

import * as set from '~/util/set'

export function makeCubeModel(): ModelNode {
  // prettier-ignore
  const positions = new Float32Array([
    1, 1, -1, 
    1, 1, 1,  
    1, -1, 1, 
    1, -1, -1,
    -1, 1, 1,
    -1, 1, -1,
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    -1, 1, -1,
    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1,
    1, 1, 1,
    -1, 1, 1,
    -1, -1, 1,
    1, -1, 1,
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    -1, -1, -1,
  ])

  // prettier-ignore
  const normals = new Float32Array([
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ])

  // prettier-ignore
  const indices = new Uint16Array([
    0, 1, 2,
    0, 2, 3,
    4, 5, 6,
    4, 6, 7,
    8, 9, 10,
    8, 10, 11,
    12, 13, 14,
    12, 14, 15,
    16, 17, 18,
    16, 18, 19,
    20, 21, 22,
    20, 22, 23,
  ])

  return {
    name: 'cube',
    mesh: {
      primitive: MeshPrimitive.Triangles,
      positions: {
        buffer: positions,
        glType: 5126 as GLenum, // gl.Float
        componentCount: positions.length,
        componentsPerAttrib: 3,
      },
      normals: {
        buffer: normals,
        glType: 5126 as GLenum, // gl.Float
        componentCount: normals.length,
        componentsPerAttrib: 3,
      },
      indices: {
        buffer: indices,
        glType: 5123 as GLenum, // gl.USHORT
        componentCount: indices.length,
        componentsPerAttrib: 1,
      },
    },
    children: [],
  }
}

export function makeLineCubeModel(): ModelNode {
  // prettier-ignore
  const positions = new Float32Array([
    // front
    -0.5, 0.5, -0.5, // nw
    0.5, 0.5, -0.5, //  ne
    0.5, -0.5, -0.5, // se
    -0.5, -0.5, -0.5, // sw    

    // back
    -0.5, 0.5, 0.5, // nw
    0.5, 0.5, 0.5, //  ne
    0.5, -0.5, 0.5, // se
    -0.5, -0.5, 0.5, // sw        
  ])

  // prettier-ignore
  const indices = new Uint16Array([
    0, 1,
    1, 2,
    2, 3,
    3, 0,

    4, 5,
    5, 6,
    6, 7,
    7, 4,

    0, 4,
    1, 5,
    2, 6,
    3, 7,
  ])

  return {
    name: 'root',
    mesh: {
      primitive: MeshPrimitive.Lines,
      positions: {
        buffer: positions,
        glType: 5126 as GLenum, // gl.Float
        componentCount: positions.length,
        componentsPerAttrib: 3,
      },
      normals: {
        // The normal values don't matter. We should consider a refactor where
        // normals aren't assumed to be required.
        buffer: new Float32Array(8 * 3),
        glType: 5126 as GLenum, // gl.Float
        componentCount: 8 * 3,
        componentsPerAttrib: 3,
      },
      indices: {
        buffer: indices,
        glType: 5123 as GLenum, // gl.USHORT
        componentCount: indices.length,
        componentsPerAttrib: 1,
      },
    },
    children: [],
  }
}

/**
 * Generate a new triangle-based ModelNode in which all meshes are augmented
 * with the edgeOn attribute. The attribute is a vec3. With the frag shader, at
 * least one component of the edgeOn varying will approach 1 if the fragment is
 * near an edge that should be shaded with the stroke color, rather than the
 * fill color.
 *
 * Use this for a single-pass wiresolid rendering strategy.
 *
 * This function operates recursively, and will return an augmented version of
 * the entire source tree.
 */
export function triModelAddEdgeOn(src: ModelNode): ModelNode {
  const res: ModelNode = {
    name: src.name,
    children: [],
  }

  if (src.transform !== undefined) {
    res.transform = mat4.clone(src.transform)
  }

  if (src.mesh !== undefined) {
    if (src.mesh.primitive !== MeshPrimitive.Triangles) {
      throw `invalid mesh primitive: ${src.mesh.primitive}`
    }
    res.mesh = triMeshAddEdgeOn(src.mesh)
  }

  for (const child of src.children) {
    res.children.push(triModelAddEdgeOn(child))
  }

  return res
}

/**
 * Generates a new line-based model node from the provided triangle-based model
 * node. Following the wiresolid aesthetic, edges that are shared between
 * neighboring co-planar triangles will not be included in the line meshes.
 *
 * Use this function to generate geometry for the second pass of a two-pass
 * wiresolid rendering strategy.
 *
 * This function works recursively, returning a line-based version of the entire
 * source tree.
 */
export function triModelToWiresolidLineModel(src: ModelNode): ModelNode {
  const res: ModelNode = {
    name: src.name,
    children: [],
  }

  if (src.transform !== undefined) {
    res.transform = mat4.clone(src.transform)
  }

  if (src.mesh !== undefined) {
    if (src.mesh.primitive !== MeshPrimitive.Triangles) {
      throw `invalid mesh primitive: ${src.mesh.primitive}`
    }
    res.mesh = triMeshToWiresolidLineMesh(src.mesh)
  }

  for (const child of src.children) {
    res.children.push(triModelToWiresolidLineModel(child))
  }

  return res
}

function triMeshAddEdgeOn(src: DataMesh): DataMesh {
  const edgeOnIndices = getWiresolidEdges(src.indices.buffer)
  const edgeSet: Set<string> = new Set()
  for (let e = 0; e < edgeOnIndices.length - 1; e += 2) {
    edgeSet.add(`${edgeOnIndices[e]}:${edgeOnIndices[e + 1]}`)
  }

  const positions = []
  const normals = []
  const edgeOn = []
  const indices = []

  for (let i = 0; i < src.indices.buffer.length - 2; i += 3) {
    const a = i + 0
    const b = i + 1
    const c = i + 2
    indices.push(a, b, c)

    const vertA = src.indices.buffer[a]
    const vertB = src.indices.buffer[b]
    const vertC = src.indices.buffer[c]

    for (const vertIndex of [vertA, vertB, vertC]) {
      const dataOffset = vertIndex * 3

      positions.push(
        src.positions.buffer[dataOffset],
        src.positions.buffer[dataOffset + 1],
        src.positions.buffer[dataOffset + 2],
      )

      normals.push(
        src.normals.buffer[dataOffset],
        src.normals.buffer[dataOffset + 1],
        src.normals.buffer[dataOffset + 2],
      )
    }

    const vertAEdgeOn = [0, 0, 0]
    const vertBEdgeOn = [0, 0, 0]
    const vertCEdgeOn = [0, 0, 0]

    if (edgeSet.has(`${vertA}:${vertB}`)) {
      vertAEdgeOn[0] = 1
      vertBEdgeOn[0] = 1
    }
    if (edgeSet.has(`${vertB}:${vertC}`)) {
      vertBEdgeOn[1] = 1
      vertCEdgeOn[1] = 1
    }
    if (edgeSet.has(`${vertC}:${vertA}`)) {
      vertCEdgeOn[2] = 1
      vertAEdgeOn[2] = 1
    }

    edgeOn.push(...vertAEdgeOn, ...vertBEdgeOn, ...vertCEdgeOn)
  }

  return {
    primitive: MeshPrimitive.Triangles,
    positions: {
      ...src.positions,
      buffer: new Float32Array(positions),
      componentCount: positions.length,
    },
    normals: {
      ...src.normals,
      buffer: new Float32Array(normals),
      componentCount: normals.length,
    },
    indices: {
      ...src.indices,
      buffer: new Uint16Array(indices),
      componentCount: indices.length,
    },
    edgeOn: {
      // TODO: we may be able to use unsigned byte here, as long as we convert
      // to a float value in the vertex shader.
      buffer: new Float32Array(edgeOn),
      glType: 5126 as GLenum, // gl.Float
      componentCount: edgeOn.length,
      componentsPerAttrib: 3,
    },
  }
}

function triMeshToWiresolidLineMesh(
  src: TriangleMesh<BufferArray>,
): LineMesh<BufferArray> {
  const indices = getWiresolidEdges(src.indices.buffer)

  // TODO: some position and normal entries might go unused as a result of
  // common edge elimination, but we preserve them all in the resulting buffers.
  // It would be nice to remove them.
  return {
    primitive: MeshPrimitive.Lines,
    positions: {
      ...src.positions,
      buffer: src.positions.buffer.slice(),
    },
    normals: {
      ...src.normals,
      buffer: src.normals.buffer.slice(),
    },
    indices: {
      buffer: new Uint16Array(indices),
      glType: 5123 as GLenum, // Unsigned short
      componentCount: indices.length,
      componentsPerAttrib: 2,
    },
  }
}

/**
 * Given an array of triangle indices (an element array buffer for a triangle
 * primitive), returns an array of index pairs that define the wiresolid edges.
 * This is the set of all triangle edges, minus those that are shared by
 * co-planar triangles.
 */
function getWiresolidEdges(triIndices: BufferArray): number[] {
  const trisByVert: Map<number, Set<number>> = new Map()
  for (let i = 0; i < triIndices.length; i++) {
    const vert = triIndices[i]

    let list = trisByVert.get(vert)
    if (list === undefined) {
      list = new Set()
      trisByVert.set(vert, list)
    }

    const tri = Math.floor(i / 3)
    list.add(tri)
  }

  const lineIndices: number[] = []
  for (let t = 0; t < triIndices.length / 3; t++) {
    const a = triIndices[t * 3 + 0]
    const b = triIndices[t * 3 + 1]
    const c = triIndices[t * 3 + 2]
    for (const [v1, v2] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      if (
        set.intersection(trisByVert.get(v1)!, trisByVert.get(v2)!).size === 1
      ) {
        lineIndices.push(v1)
        lineIndices.push(v2)
      }
    }
  }

  return lineIndices
}
