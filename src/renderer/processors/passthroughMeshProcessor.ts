import {
  Buffer,
  BufferArray,
  ModelNode,
  RenderMesh,
  RenderNode,
} from '~/renderer/common'

export const getGLPassthroughMesh: (
  m: ModelNode,
  gl: WebGL2RenderingContext,
) => RenderNode = (model, gl) => {
  const node: RenderNode = {
    name: model.name,
    children: [],
  }

  if (model.transform != null) {
    node.transform = model.transform
  }

  if (model.mesh != null) {
    const newMesh: RenderMesh = {
      positions: getGlBuffer(model.mesh.positions, gl),
      normals: getGlBuffer(model.mesh.normals, gl),
      indices: getGlBuffer(model.mesh.indices, gl, { isIndexBuffer: true }),
      primitive: model.mesh.primitive,
    }

    node.mesh = newMesh
  }

  for (const child of model.children) {
    node.children.push(getGLPassthroughMesh(child, gl))
  }

  return node
}

export const getGlBuffer: (
  buffer: Buffer<BufferArray>,
  gl: WebGL2RenderingContext,
  opts?: { isIndexBuffer: boolean },
) => Buffer<WebGLBuffer> = (buffer, gl, opts = { isIndexBuffer: false }) => {
  // Write data to a GL buffer
  const glBuffer = gl.createBuffer()
  if (glBuffer === null) {
    throw new Error('unable to create GL buffer')
  }
  // Specifying the precise target matters because it sets a property on the
  // buffer object.
  const target = opts.isIndexBuffer ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER
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
