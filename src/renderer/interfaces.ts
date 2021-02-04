import { mat4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type BufferArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Float32Array

export type ModelModifiers = {
  [key: string]: Immutable<mat4>
}

export enum MeshPrimitive {
  Triangles,
  Lines,
}

export interface Buffer {
  bufferData: BufferArray
  glType: GLenum // FLOAT, etc.
  componentCount: number // total number of component values of type glType
  componentsPerAttrib: number // number of component values per attribute
}

export type DataMesh = {
  primitive: MeshPrimitive
  positions: Buffer
  indices: Buffer
  normals?: Buffer
  colors?: Buffer
  edgeOn?: Buffer
}

export interface ModelNode {
  name: string
  mesh?: DataMesh
  transform?: mat4
  children: ModelNode[]
}
