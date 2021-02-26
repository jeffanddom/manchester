import { mat4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type NumericArray =
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

export interface MeshBuffer {
  bufferData: NumericArray
  componentsPerAttrib: number // number of component values per attribute
}

export type DataMesh = {
  primitive: MeshPrimitive
  positions: MeshBuffer
  indices: MeshBuffer
  normals?: MeshBuffer
  colors?: MeshBuffer
  edgeOn?: MeshBuffer
}

export interface ModelNode {
  name: string
  meshes: DataMesh[]
  transform?: mat4
  children: ModelNode[]
}
