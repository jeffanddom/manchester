import { mat4 } from 'gl-matrix'

import {
  ArrayDataType,
  DataMesh,
  DataMeshInstanced,
  MeshBuffer,
  MeshPrimitive,
  ModelNode,
  NumericArray,
} from '../renderer/interfaces'

import { ShaderAttrib } from './shaders/common'

export interface RenderMesh {
  primitive: MeshPrimitive
  vao: WebGLVertexArrayObject
  count: number // number of elements in index buffer
  type: ArrayDataType // type of index buffer element
}

export interface RenderMeshInstanced {
  primitive: MeshPrimitive
  vao: WebGLVertexArrayObject
  instanceAttribBuffers: Map<number, WebGLBuffer>
  vertsPerInstance: number
  maxInstances: number // capacity of each instance attrib buffer
}

export interface RenderNode {
  name: string
  meshes: RenderMesh[]
  transform?: mat4
  children: RenderNode[]
}

export function makeRenderNode(
  gl: WebGL2RenderingContext,
  src: ModelNode,
): RenderNode {
  const node: RenderNode = {
    name: src.name,
    meshes: [],
    children: [],
  }

  if (src.transform !== undefined) {
    node.transform = src.transform
  }

  for (const dataMesh of src.meshes) {
    node.meshes.push(makeRenderMesh(gl, dataMesh))
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

  bindAttribBuffer(gl, src.positions, ShaderAttrib.Position)
  bindIndexBuffer(gl, src.indices)

  if (src.normals !== undefined) {
    bindAttribBuffer(gl, src.normals, ShaderAttrib.Normal)
  }

  if (src.colors !== undefined) {
    bindAttribBuffer(gl, src.colors, ShaderAttrib.VertexColor)
  }

  if (src.edgeOn !== undefined) {
    bindAttribBuffer(gl, src.edgeOn, ShaderAttrib.EdgeOn)
  }

  gl.bindVertexArray(null)

  // Ensure future buffer ops don't modify this VAO
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  return {
    primitive: src.primitive,
    vao,
    count: src.indices.bufferData.length,
    type: numericArrayToArrayDataType(src.indices.bufferData),
  }
}

export function makeRenderMeshInstanced(
  gl: WebGL2RenderingContext,
  src: DataMeshInstanced,
  maxInstances: number,
): RenderMeshInstanced {
  const vao = gl.createVertexArray()
  if (vao === null) {
    throw `could not create VAO`
  }

  gl.bindVertexArray(vao)

  for (const [attrib, buffer] of src.attribBuffers) {
    bindAttribBuffer(gl, buffer, attrib)
  }

  const instanceAttribBuffers: Map<number, WebGLBuffer> = new Map()
  for (const [attrib, bufferConfig] of src.instanceAttribBufferConfig) {
    const buffer = gl.createBuffer()
    if (buffer === null) {
      throw `failed to create buffer`
    }

    const bufferData = createNumericArray(
      bufferConfig.arrayType,
      maxInstances *
        bufferConfig.componentsPerAttrib *
        (bufferConfig.attribSlots ?? 1),
    )
    const glBuffer = bindAttribBuffer(
      gl,
      { bufferData, componentsPerAttrib: bufferConfig.componentsPerAttrib },
      attrib,
      { isPerInstance: true },
    )

    instanceAttribBuffers.set(attrib, glBuffer)
  }

  gl.bindVertexArray(null)

  // Ensure future buffer ops don't modify this VAO
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  return {
    primitive: src.primitive,
    vao,
    instanceAttribBuffers,
    vertsPerInstance: src.vertsPerInstance,
    maxInstances,
  }
}

export function bindAttribBuffer(
  gl: WebGL2RenderingContext,
  src: MeshBuffer,
  attribLoc: number,
  opts: {
    attribSlots?: number
    isPerInstance?: boolean
  } = {},
): WebGLBuffer {
  const glBuffer = gl.createBuffer()
  if (glBuffer === null) {
    throw new Error('unable to create GL buffer')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, src.bufferData, gl.STATIC_DRAW)

  const attribSlots = opts.attribSlots ?? 1
  const arrayDataType = numericArrayToArrayDataType(src.bufferData)
  const attribLocStride =
    src.componentsPerAttrib * arrayDataTypeElementSize(arrayDataType)

  for (let i = 0; i < attribSlots; i++) {
    const attribSlotLoc = attribLoc + i

    gl.enableVertexAttribArray(attribSlotLoc)
    gl.vertexAttribPointer(
      attribSlotLoc,
      src.componentsPerAttrib,
      arrayDataType,
      false,
      attribSlots * attribLocStride,
      i * attribLocStride,
    )

    if (opts.isPerInstance === true) {
      gl.vertexAttribDivisor(attribSlotLoc, 1)
    }
  }

  // Ensure future buffer ops don't modify this buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  return glBuffer
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

function numericArrayToArrayDataType(array: NumericArray): ArrayDataType {
  if (array instanceof Int8Array) {
    return ArrayDataType.Byte
  }
  if (array instanceof Uint8Array) {
    return ArrayDataType.UnsignedByte
  }
  if (array instanceof Int16Array) {
    return ArrayDataType.Short
  }
  if (array instanceof Uint16Array) {
    return ArrayDataType.UnsignedShort
  }
  if (array instanceof Int32Array) {
    return ArrayDataType.Int
  }
  if (array instanceof Uint32Array) {
    return ArrayDataType.UnsignedInt
  }
  if (array instanceof Float32Array) {
    return ArrayDataType.Float
  }

  throw `should be unreachable`
}

function createNumericArray(
  typ: ArrayDataType,
  capacity: number,
): NumericArray {
  switch (typ) {
    case ArrayDataType.Byte:
      return new Int8Array(capacity)
    case ArrayDataType.UnsignedByte:
      return new Uint8Array(capacity)
    case ArrayDataType.Short:
      return new Int16Array(capacity)
    case ArrayDataType.UnsignedShort:
      return new Uint16Array(capacity)
    case ArrayDataType.Int:
      return new Int32Array(capacity)
    case ArrayDataType.UnsignedInt:
      return new Uint32Array(capacity)
    case ArrayDataType.Float:
      return new Float32Array(capacity)
  }
}

export function arrayDataTypeElementSize(t: ArrayDataType): number {
  switch (t) {
    case ArrayDataType.Byte:
      return 1
    case ArrayDataType.UnsignedByte:
      return 1
    case ArrayDataType.Short:
      return 2
    case ArrayDataType.UnsignedShort:
      return 2
    case ArrayDataType.Int:
      return 4
    case ArrayDataType.UnsignedInt:
      return 4
    case ArrayDataType.Float:
      return 4
  }
}
