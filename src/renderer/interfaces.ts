import { mat4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type NumericArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Int32Array
  | Float32Array

export enum ArrayDataType {
  Byte = 5120,
  UnsignedByte = 5121,
  Short = 5122,
  UnsignedShort = 5123,
  Int = 5124,
  UnsignedInt = 5125,
  Float = 5126,
}

export type ModelModifiers = {
  [key: string]: Immutable<mat4>
}

export enum MeshPrimitive {
  Triangles,
  Lines,
}

export interface MeshBuffer {
  bufferData: NumericArray
  componentsPerAttrib: number // number of component values per attribute
}

export type DataMesh = {
  primitive: MeshPrimitive
  attribBuffers: Map<number, MeshBuffer>
  indices: MeshBuffer
}

export interface BufferConfig {
  arrayType: ArrayDataType
  componentsPerAttrib: number // number of component values per attribute
  attribSlots?: number // number of slots consumed by this attribute
}

export type DataMeshInstanced = {
  primitive: MeshPrimitive
  attribBuffers: Map<number, MeshBuffer>
  instanceAttribBufferConfig: Map<number, BufferConfig>
  vertsPerInstance: number
}

export interface ModelNode {
  name: string
  meshes: DataMesh[]
  transform?: mat4
  children: ModelNode[]
}
