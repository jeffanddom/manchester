import { mat4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type BufferArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Float32Array

export enum ModelPrimitive {
  Lines,
  Triangles,
}

export type ModelModifiers = {
  [key: string]: Immutable<mat4>
}

// NEW MODEL/MESH STUFF IS BELOW

// TODO: maybe add primitives for lines, points, etc.
export enum MeshPrimitive {
  Triangles,
  Lines,
}

export interface Buffer<T> {
  buffer: T
  glType: GLenum // FLOAT, etc.
  componentCount: number // total number of component values of type glType
  componentsPerAttrib: number // number of component values per attribute
}

export interface TriangleMesh<T> {
  primitive: MeshPrimitive.Triangles
  positions: Buffer<T>
  normals: Buffer<T>
  indices: Buffer<T>
  colors?: Buffer<T>
  edgeOn?: Buffer<T>
}

export interface LineMesh<T> {
  primitive: MeshPrimitive.Lines
  positions: Buffer<T>
  normals: Buffer<T>
  indices: Buffer<T>
  colors?: Buffer<T>
}

export type DataMesh = TriangleMesh<BufferArray> | LineMesh<BufferArray>

export interface ModelNode {
  name: string
  mesh?: DataMesh
  transform?: mat4
  children: ModelNode[]
}
