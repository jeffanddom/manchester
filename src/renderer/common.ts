import { mat4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export enum ModelPrimitive {
  Lines,
  Triangles,
}

export type ModelModifiers = {
  [key: string]: Immutable<mat4>
}

export type ModelDef = {
  primitive: ModelPrimitive
  positions: Float32Array
  colors?: Float32Array
  normals?: Float32Array
}

// NEW MODEL/MESH STUFF IS BELOW

// TODO: maybe add primitives for lines, points, etc.
export enum MeshPrimitive {
  Triangles,
}

export interface Buffer {
  glBuffer: WebGLBuffer
  glType: GLenum // FLOAT, etc.
  componentCount: number // total number of component values of type glType
  componentsPerAttrib: number // number of component values per attribute
}

export interface TriangleMesh {
  positions: Buffer
  normals: Buffer
  indices: Buffer
  primitive: MeshPrimitive.Triangles
}

export type Mesh = TriangleMesh

export interface ModelNode {
  name: string
  mesh?: Mesh
  transform?: mat4
  children: ModelNode[]
}
