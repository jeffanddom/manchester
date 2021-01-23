import { getSolidwireEdges } from '../geometryUtils'
import { getGlBuffer } from '../glUtils'

import {
  MeshPrimitive,
  ModelNode,
  RenderMesh,
  RenderNode,
} from '~/renderer/interfaces'

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

    const lineIndices = getSolidwireEdges(m.mesh.indices.buffer)

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
