import {
  Buffer,
  BufferArray,
  DataMesh,
  ModelNode,
  RenderMesh,
  RenderNode,
} from '../renderer/interfaces'

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
  return {
    positions: getGlBuffer(src.positions, gl),
    normals: getGlBuffer(src.normals, gl),
    indices: getGlBuffer(src.indices, gl, { isIndexBuffer: true }),
    primitive: src.primitive,
  }
}

function getGlBuffer(
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
