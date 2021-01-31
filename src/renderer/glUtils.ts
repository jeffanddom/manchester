import { mat4 } from 'gl-matrix'

import {
  Buffer,
  BufferArray,
  DataMesh,
  LineMesh,
  MeshPrimitive,
  ModelNode,
  TriangleMesh,
} from '../renderer/interfaces'

// TODO: this should just hold VAOs with pre-bound buffers
export type RenderMesh = TriangleMesh<WebGLBuffer> | LineMesh<WebGLBuffer>

export interface RenderNode {
  name: string
  mesh?: RenderMesh
  transform?: mat4
  children: RenderNode[]
}

export function makeRenderNode(
  src: ModelNode,
  gl: WebGL2RenderingContext,
): RenderNode {
  const node: RenderNode = {
    name: src.name,
    children: [],
  }

  if (src.transform != null) {
    node.transform = src.transform
  }

  if (src.mesh != null) {
    node.mesh = makeRenderMesh(src.mesh, gl)
  }

  for (const child of src.children) {
    node.children.push(makeRenderNode(child, gl))
  }

  return node
}

function makeRenderMesh(src: DataMesh, gl: WebGL2RenderingContext): RenderMesh {
  switch (src.primitive) {
    case MeshPrimitive.Triangles: {
      const res: RenderMesh = {
        positions: getGlBuffer(src.positions, gl),
        normals: getGlBuffer(src.normals, gl),
        indices: getGlBuffer(src.indices, gl, { isIndexBuffer: true }),
        primitive: MeshPrimitive.Triangles,
      }

      if (src.colors !== undefined) {
        res.colors = getGlBuffer(src.colors, gl)
      }

      if (src.edgeOn !== undefined) {
        res.edgeOn = getGlBuffer(src.edgeOn, gl)
      }

      return res
    }

    case MeshPrimitive.Lines: {
      const res: RenderMesh = {
        positions: getGlBuffer(src.positions, gl),
        normals: getGlBuffer(src.normals, gl),
        indices: getGlBuffer(src.indices, gl, { isIndexBuffer: true }),
        primitive: MeshPrimitive.Lines,
      }

      if (src.colors !== undefined) {
        res.colors = getGlBuffer(src.colors, gl)
      }

      return res
    }
  }
}

export function getGlBuffer(
  buffer: Buffer<BufferArray>,
  gl: WebGL2RenderingContext,
  opts?: { isIndexBuffer: boolean },
): Buffer<WebGLBuffer> {
  // Write data to a GL buffer
  const glBuffer = gl.createBuffer()
  if (glBuffer === null) {
    throw new Error('unable to create GL buffer')
  }

  // Specifying the precise target matters because it sets a property on the
  // buffer object.
  const target =
    opts !== undefined && opts.isIndexBuffer
      ? gl.ELEMENT_ARRAY_BUFFER
      : gl.ARRAY_BUFFER
  gl.bindVertexArray(null)
  gl.bindBuffer(target, glBuffer)
  gl.bufferData(target, buffer.buffer, gl.STATIC_DRAW)
  return {
    buffer: glBuffer,
    glType: buffer.glType,
    componentCount: buffer.componentCount,
    componentsPerAttrib: buffer.componentsPerAttrib,
  }
}
