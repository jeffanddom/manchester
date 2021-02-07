import { mat4 } from 'gl-matrix'

import {
  DataMesh,
  MeshBuffer,
  MeshPrimitive,
  ModelNode,
  NumericArray,
} from '../renderer/interfaces'

import { ShaderAttribLoc } from './shaders/common'

export interface RenderMesh {
  primitive: MeshPrimitive
  vao: WebGLVertexArrayObject
  count: number // number of elements in index buffer
  type: GLenum // type of index buffer element
}

export interface RenderNode {
  name: string
  mesh?: RenderMesh
  transform?: mat4
  children: RenderNode[]
}

export function makeRenderNode(
  gl: WebGL2RenderingContext,
  src: ModelNode,
): RenderNode {
  const node: RenderNode = {
    name: src.name,
    children: [],
  }

  if (src.transform !== undefined) {
    node.transform = src.transform
  }

  if (src.mesh !== undefined) {
    node.mesh = makeRenderMesh(gl, src.mesh)
  }

  for (const child of src.children) {
    node.children.push(makeRenderNode(gl, child))
  }

  return node
}

function makeRenderMesh(gl: WebGL2RenderingContext, src: DataMesh): RenderMesh {
  const vao = gl.createVertexArray()
  if (vao === null) {
    throw `could not create VAO`
  }

  gl.bindVertexArray(vao)

  bindAttribBuffer(gl, src.positions, ShaderAttribLoc.Position)
  bindIndexBuffer(gl, src.indices)

  if (src.normals !== undefined) {
    bindAttribBuffer(gl, src.normals, ShaderAttribLoc.Normal)
  }

  if (src.colors !== undefined) {
    bindAttribBuffer(gl, src.colors, ShaderAttribLoc.Color)
  }

  if (src.edgeOn !== undefined) {
    bindAttribBuffer(gl, src.edgeOn, ShaderAttribLoc.EdgeOn)
  }

  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  return {
    primitive: src.primitive,
    vao,
    count: src.indices.bufferData.length,
    type: numericArrayToGLType(gl, src.indices.bufferData),
  }
}

export function bindAttribBuffer(
  gl: WebGL2RenderingContext,
  src: MeshBuffer,
  attribLoc: ShaderAttribLoc,
): void {
  const glBuffer = gl.createBuffer()
  if (glBuffer === null) {
    throw new Error('unable to create GL buffer')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, src.bufferData, gl.STATIC_DRAW)

  gl.enableVertexAttribArray(attribLoc)
  gl.vertexAttribPointer(
    attribLoc,
    src.componentsPerAttrib,
    numericArrayToGLType(gl, src.bufferData),
    false,
    0,
    0,
  )
}

export function bindIndexBuffer(
  gl: WebGL2RenderingContext,
  src: MeshBuffer,
): void {
  const glBuffer = gl.createBuffer()
  if (glBuffer === null) {
    throw new Error('unable to create GL buffer')
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, src.bufferData, gl.STATIC_DRAW)
}

function numericArrayToGLType(
  gl: WebGL2RenderingContext,
  array: NumericArray,
): GLenum {
  if (array instanceof Uint8Array) {
    return gl.UNSIGNED_BYTE
  }
  if (array instanceof Int8Array) {
    return gl.BYTE
  }
  if (array instanceof Uint16Array) {
    return gl.UNSIGNED_SHORT
  }
  if (array instanceof Int16Array) {
    return gl.SHORT
  }
  if (array instanceof Uint32Array) {
    return gl.UNSIGNED_INT
  }
  if (array instanceof Int32Array) {
    return gl.INT
  }
  if (array instanceof Float32Array) {
    return gl.FLOAT
  }

  throw `should be unreachable`
}
