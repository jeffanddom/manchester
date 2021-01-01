import { mat4, quat, vec3 } from 'gl-matrix'

import * as renderer from '~/renderer/common'
import {
  AccessorComponentType,
  AccessorType,
  Document,
  PrimitiveAttribute,
  PrimitiveMode,
} from '~/renderer/gltf/types'

export { Document } from '~/renderer/gltf/types'

export function accessorComponentTypeSize(t: AccessorComponentType): number {
  switch (t) {
    case AccessorComponentType.Byte:
      return 1
    case AccessorComponentType.UnsignedByte:
      return 1
    case AccessorComponentType.Short:
      return 2
    case AccessorComponentType.UnsignedShort:
      return 2
    case AccessorComponentType.UnsignedInt:
      return 4
    case AccessorComponentType.Float:
      return 4
  }
}

export function accessorComponentTypeToGLType(
  gl: WebGL2RenderingContext,
  t: AccessorComponentType,
): GLenum {
  switch (t) {
    case AccessorComponentType.Byte:
      return gl.BYTE
    case AccessorComponentType.UnsignedByte:
      return gl.UNSIGNED_BYTE
    case AccessorComponentType.Short:
      return gl.SHORT
    case AccessorComponentType.UnsignedShort:
      return gl.UNSIGNED_SHORT
    case AccessorComponentType.UnsignedInt:
      return gl.UNSIGNED_INT
    case AccessorComponentType.Float:
      return gl.FLOAT
  }
}

export function accessorTypeDegree(t: AccessorType): number {
  switch (t) {
    case AccessorType.Scalar:
      return 1
    case AccessorType.Vec2:
      return 2
    case AccessorType.Vec3:
      return 3
    case AccessorType.Vec4:
      return 4
    case AccessorType.Mat2:
      return 4
    case AccessorType.Mat3:
      return 9
    case AccessorType.Mat4:
      return 16
  }
}

type BufferArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Float32Array

/**
 * Takes an ArrayBuffer and returns a typed array corresponding to the provided
 * accessor and buffer view parameters.
 */
function applyAccessor(
  bytes: ArrayBuffer,
  type: AccessorType,
  componentType: AccessorComponentType,
  count: number,
  opts: {
    accessorOffset?: number
    bufferViewOffset?: number
    stride?: number
  } = {},
): BufferArray {
  const offset = (opts.accessorOffset ?? 0) + (opts.bufferViewOffset ?? 0)
  const degree = accessorTypeDegree(type)
  const elementSize = degree * accessorComponentTypeSize(componentType)
  if (opts.stride !== undefined && opts.stride !== elementSize) {
    throw new Error(`interleaved buffer views not yet supported`)
  }

  switch (componentType) {
    case AccessorComponentType.Byte:
      return new Int8Array(bytes, offset, count * degree)
    case AccessorComponentType.UnsignedByte:
      return new Uint8Array(bytes, offset, count * degree)
    case AccessorComponentType.Short:
      return new Int16Array(bytes, offset, count * degree)
    case AccessorComponentType.UnsignedShort:
      return new Uint16Array(bytes, offset, count * degree)
    case AccessorComponentType.UnsignedInt:
      return new Uint32Array(bytes, offset, count * degree)
    case AccessorComponentType.Float:
      return new Float32Array(bytes, offset, count * degree)
  }
}

export function fromJson(json: string): Document {
  return JSON.parse(json) as Document
}

export function makeNode(
  gl: WebGL2RenderingContext,
  doc: Document,
  nodeId: number,
): renderer.ModelNode {
  const nodes = doc.nodes ?? []
  if (nodes.length < nodeId) {
    throw new Error(`node ${nodeId} not defined in glTF document`)
  }
  const gltfNode = nodes[nodeId]

  const name = gltfNode.name
  if (name === undefined || name.length === 0) {
    throw new Error(`glTF node has unefined or empty name`)
  }

  const modelNode: renderer.ModelNode = {
    name,
    children: [],
  }

  // Mesh
  if (gltfNode.mesh !== undefined) {
    modelNode.mesh = makeMesh(gl, doc, gltfNode.mesh)
  }

  // Transform
  if (gltfNode.matrix !== undefined) {
    modelNode.transform = mat4.fromValues(...gltfNode.matrix)
  } else if (
    gltfNode.rotation !== undefined ||
    gltfNode.translation !== undefined ||
    gltfNode.scale !== undefined
  ) {
    modelNode.transform = mat4.fromRotationTranslationScale(
      mat4.create(),
      gltfNode.rotation !== undefined
        ? quat.fromValues(...gltfNode.rotation)
        : quat.create(),
      gltfNode.translation !== undefined
        ? vec3.fromValues(...gltfNode.translation)
        : vec3.create(),
      gltfNode.scale !== undefined
        ? vec3.fromValues(...gltfNode.scale)
        : vec3.fromValues(1, 1, 1),
    )
  }

  // Children
  modelNode.children = (gltfNode.children ?? []).map((childNodeId) =>
    makeNode(gl, doc, childNodeId),
  )

  return modelNode
}

function makeMesh(
  gl: WebGL2RenderingContext,
  doc: Document,
  meshId: number,
): renderer.Mesh {
  const meshes = doc.meshes ?? []
  if (meshes.length < meshId) {
    throw new Error(`mesh ${meshId}: not defined in glTF document`)
  }
  const gltfMesh = meshes[meshId]

  // Mesh primitive
  if (gltfMesh.primitives.length !== 1) {
    throw new Error(
      `mesh ${meshId}: unsupported primitive count (${gltfMesh.primitives.length})`,
    )
  }
  const primitive = gltfMesh.primitives[0]

  const primitiveMode = primitive.mode ?? PrimitiveMode.Triangles // triangles are the glTF default
  if (primitiveMode !== PrimitiveMode.Triangles) {
    throw new Error(
      `mesh ${meshId}: unsupported primitive mode ${primitiveMode}`,
    )
  }

  // Extract accessors for position attrib, normal attrib, and indexes.
  const attributes = primitive.attributes
  if (!attributes.hasOwnProperty(PrimitiveAttribute.Position)) {
    throw new Error(`mesh ${meshId}: missing accessor for position attribute`)
  }
  if (!attributes.hasOwnProperty(PrimitiveAttribute.Normal)) {
    throw new Error(`mesh ${meshId}: missing accessor for normal attribute`)
  }
  const positionAccessorId = attributes[PrimitiveAttribute.Position]
  const normalAccessorId = attributes[PrimitiveAttribute.Normal]

  const indexAccessorId = primitive.indices
  if (indexAccessorId === undefined) {
    throw new Error(`mesh ${meshId}: primitive has no accessor index`)
  }

  const positions = makeRendererBuffer(gl, doc, positionAccessorId)
  const normals = makeRendererBuffer(gl, doc, normalAccessorId)
  const indices = makeRendererBuffer(gl, doc, indexAccessorId, {
    isIndexBuffer: true,
  })

  return {
    positions,
    normals,
    indices,
    primitive: renderer.MeshPrimitive.Triangles,
  }
}

function makeRendererBuffer(
  gl: WebGL2RenderingContext,
  doc: Document,
  accessorId: number,
  opts: { isIndexBuffer: boolean } = { isIndexBuffer: false },
): renderer.Buffer {
  const accessors = doc.accessors ?? []
  if (accessors.length < accessorId) {
    throw new Error(`accessor ${accessorId}: not defined in glTF document`)
  }
  const accessor = accessors[accessorId]

  // Buffer view
  const bufferViewId = accessor.bufferView
  if (bufferViewId === undefined) {
    throw new Error(
      `accessor ${accessorId}: buffer view not defined in accessor`,
    )
  }
  const bufferViews = doc.bufferViews ?? []
  if (bufferViews.length < bufferViewId) {
    throw new Error(
      `accessor ${accessorId}: buffer view not defined in glTF document`,
    )
  }
  const bufferView = bufferViews[bufferViewId]

  // Buffer
  const bufferId = bufferView.buffer
  const buffers = doc.buffers ?? []
  if (buffers.length < bufferId) {
    throw new Error(
      `accessor ${accessorId}: buffer ${bufferId} not defined in glTF document`,
    )
  }
  const buffer = buffers[bufferId]

  // Raw buffer data
  // We expect the data to be an RFC2397 Base64-encoded octet stream.
  const prefix = 'data:application/octet-stream;base64,'
  if (buffer.uri === undefined || !buffer.uri.startsWith(prefix)) {
    throw new Error(
      `accessor ${accessorId}: buffer ${bufferId}: URI format not supported`,
    )
  }

  const dataString = atob(buffer.uri.slice(prefix.length))
  if (dataString.length !== buffer.byteLength) {
    throw new Error(
      `accessor ${accessorId}: buffer ${bufferId}: encoded data does not match byteLenght`,
    )
  }

  // Copy data, accounting for accessor and buffer view parameters.
  // TODO: make a local cache in case multiple views/accessors use the same
  // buffer.
  const rawBytes = new Uint8Array(dataString.length)
  for (let i = 0; i < dataString.length; i++) {
    rawBytes[i] = dataString.charCodeAt(i)
  }

  const bufferOpts: Record<string, number> = {}
  if (accessor.byteOffset !== undefined) {
    bufferOpts.accessorOffset = accessor.byteOffset
  }
  if (bufferView.byteOffset !== undefined) {
    bufferOpts.bufferViewOffset = bufferView.byteOffset
  }
  if (bufferView.byteStride !== undefined) {
    bufferOpts.stride = bufferView.byteStride
  }

  const bufferData = applyAccessor(
    rawBytes.buffer,
    accessor.type,
    accessor.componentType,
    accessor.count,
    bufferOpts,
  )

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
  gl.bufferData(target, bufferData, gl.STATIC_DRAW)

  return {
    glBuffer,
    glType: accessorComponentTypeToGLType(gl, accessor.componentType),
    componentCount: accessor.count,
    componentsPerAttrib: accessorTypeDegree(accessor.type),
  }
}
