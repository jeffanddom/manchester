import { mat4 } from 'gl-matrix'

import {
  BufferArray,
  LineMesh,
  MeshPrimitive,
  ModelNode,
  TriangleMesh,
} from './interfaces'

import * as set from '~/util/set'

/**
 * Given an array of triangle indices (an element array buffer for a triangle
 * primitive), returns an array of index pairs that define the wiresolid edges.
 * This is the set of all triangle edges, minus those that are shared by
 * co-planar triangles.
 */
export function getWiresolidEdges(triIndices: BufferArray): number[] {
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
