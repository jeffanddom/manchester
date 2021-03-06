import { mat4, quat, vec3 } from 'gl-matrix'

import {
  triModelAddEdgeOn,
  triModelToWiresolidLineModel,
} from '~/engine/renderer/geometryUtils'
import {
  AccessorType,
  Document,
  PrimitiveAttribute,
  PrimitiveMode,
} from '~/engine/renderer/gltf/types'
import { arrayDataTypeElementSize } from '~/engine/renderer/glUtils'
import * as renderer from '~/engine/renderer/interfaces'
import { ArrayDataType, ModelNode } from '~/engine/renderer/interfaces'
import { IModelLoader } from '~/engine/renderer/ModelLoader'
import { ShaderAttrib } from '~/engine/renderer/shaders/common'

export { Document } from '~/engine/renderer/gltf/types'

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

/**
 * Takes an ArrayBuffer and returns a typed array corresponding to the provided
 * accessor and buffer view parameters.
 */
function applyAccessor(
  bytes: ArrayBuffer,
  type: AccessorType,
  componentType: ArrayDataType,
  count: number,
  opts: {
    accessorOffset?: number
    bufferViewOffset?: number
    stride?: number
  } = {},
): renderer.NumericArray {
  const offset = (opts.accessorOffset ?? 0) + (opts.bufferViewOffset ?? 0)
  const degree = accessorTypeDegree(type)
  const elementSize = degree * arrayDataTypeElementSize(componentType)
  if (opts.stride !== undefined && opts.stride !== elementSize) {
    throw new Error(`interleaved buffer views not yet supported`)
  }

  switch (componentType) {
    case ArrayDataType.Byte:
      return new Int8Array(bytes, offset, count * degree)
    case ArrayDataType.UnsignedByte:
      return new Uint8Array(bytes, offset, count * degree)
    case ArrayDataType.Short:
      return new Int16Array(bytes, offset, count * degree)
    case ArrayDataType.UnsignedShort:
      return new Uint16Array(bytes, offset, count * degree)
    case ArrayDataType.Int:
      return new Int32Array(bytes, offset, count * degree)
    case ArrayDataType.UnsignedInt:
      return new Uint32Array(bytes, offset, count * degree)
    case ArrayDataType.Float:
      return new Float32Array(bytes, offset, count * degree)
  }
}

export function fromJson(json: string): Document {
  return JSON.parse(json) as Document
}

export function makeNode(doc: Document, nodeId: number): renderer.ModelNode {
  const nodes = doc.nodes ?? []
  if (nodes.length < nodeId) {
    throw new Error(`node ${nodeId} not defined in glTF document`)
  }
  const gltfNode = nodes[nodeId]

  const name = gltfNode.name
  if (name === undefined || name.length === 0) {
    throw new Error(`glTF node has undefined or empty name`)
  }

  const modelNode: renderer.ModelNode = {
    name,
    meshes: [],
    children: [],
  }

  // Mesh
  if (gltfNode.mesh !== undefined) {
    modelNode.meshes = makeMeshes(doc, gltfNode.mesh)
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
    makeNode(doc, childNodeId),
  )

  return modelNode
}

function makeMeshes(doc: Document, meshId: number): renderer.DataMesh[] {
  const meshes = doc.meshes ?? []
  if (meshes.length < meshId) {
    throw new Error(`mesh ${meshId}: not defined in glTF document`)
  }
  const gltfMesh = meshes[meshId]

  // Mesh primitive
  const dataMeshes = []
  for (const primitive of gltfMesh.primitives) {
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

    const attribBuffers = new Map()
    attribBuffers.set(
      ShaderAttrib.Position,
      makeBuffer(doc, positionAccessorId),
    )
    attribBuffers.set(ShaderAttrib.Normal, makeBuffer(doc, normalAccessorId))

    dataMeshes.push({
      attribBuffers,
      indices: makeBuffer(doc, indexAccessorId),
      primitive: renderer.MeshPrimitive.Triangles,
    })
  }

  return dataMeshes
}

function makeBuffer(doc: Document, accessorId: number): renderer.MeshBuffer {
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

  return {
    bufferData: bufferData,
    componentsPerAttrib: accessorTypeDegree(accessor.type),
  }
}

export function getModels(doc: Document): ModelNode[] {
  const models: ModelNode[] = []
  for (const scene of doc.scenes ?? []) {
    for (const nodeId of scene.nodes ?? []) {
      models.push(makeNode(doc, nodeId))
    }
  }
  return models
}

export function loadAllModels(loader: IModelLoader, doc: Document): void {
  for (const scene of doc.scenes ?? []) {
    for (const nodeId of scene.nodes ?? []) {
      const modelNode = makeNode(doc, nodeId)

      // TODO: Currently, we addd all possible variants for models, but long-run
      // we shouldn't do that.

      // augment with edgeOn attribs
      loader.loadModel(modelNode.name, triModelAddEdgeOn(modelNode))

      // build line buffer
      loader.loadModel(
        modelNode.name + '-line',
        triModelToWiresolidLineModel(modelNode),
      )
    }
  }
}
