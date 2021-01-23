import { getGlBuffer } from './passthroughMeshProcessor'

import {
  BufferArray,
  MeshPrimitive,
  ModelNode,
  RenderMesh,
  RenderNode,
} from '~/renderer/interfaces'

function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result: Set<T> = new Set()
  for (const elem of b) {
    if (a.has(elem)) {
      result.add(elem)
    }
  }
  return result
}

function triMeshToLineMesh(triIndices: BufferArray): number[] {
  // fill Map<vertex index, triangle (pointer?)> -> m
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
      if (intersection(trisByVert.get(v1)!, trisByVert.get(v2)!).size === 1) {
        lineIndices.push(v1)
        lineIndices.push(v2)
      }
    }
  }

  return lineIndices
}

export const getGLLineMesh = (
  m: ModelNode,
  gl: WebGL2RenderingContext,
): RenderNode => {
  const node: RenderNode = {
    name: m.name,
    children: [],
  }

  if (m.transform !== undefined) {
    node.transform = m.transform
  }

  if (m.mesh !== undefined) {
    if (m.mesh.primitive !== MeshPrimitive.Triangles) {
      throw `mesh primitive is not triangle: ${m.mesh.primitive}`
    }

    const lineIndices = triMeshToLineMesh(m.mesh.indices.buffer)

    const newMesh: RenderMesh = {
      positions: getGlBuffer(m.mesh.positions, gl),
      normals: getGlBuffer(m.mesh.normals, gl),
      indices: getGlBuffer(
        {
          buffer: new Uint16Array(lineIndices),
          glType: gl.UNSIGNED_SHORT,
          componentCount: lineIndices.length,
          componentsPerAttrib: 2,
        },
        gl,
        {
          isIndexBuffer: true,
        },
      ),
      primitive: MeshPrimitive.Lines,
    }

    node.mesh = newMesh
  }

  for (const child of m.children) {
    node.children.push(getGLLineMesh(child, gl))
  }

  return node
}
