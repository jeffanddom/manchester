/**
 * A partial typing for glTF JSON documents. The full schema is available here:
 * JSON schema is here: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/schema/glTF.schema.json
 *
 * Using json-schema-to-typescript for autogeneration didn't yield results that
 * could stand on their own without a lot of massaging, so let's just handroll
 * some type declarations here and add things as we need them.
 */

import { ArrayDataType } from '~/engine/renderer/interfaces'

/**
 * An index into one of the top-level object arrays.
 */
type id = number

type vec3 = [number, number, number]

type vec4 = [number, number, number, number]

type quat = vec4

type mat4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

export interface Document {
  scenes?: Scene[]
  nodes?: Node[]
  meshes?: Mesh[]
  primitives?: Primitive[]
  accessors?: Accessor[]
  bufferViews?: BufferView[]
  buffers?: Buffer[]
}

export interface Scene {
  nodes?: id[]
}

export interface Node {
  name?: string
  mesh?: id
  children?: id[]
  matrix?: mat4
  rotation?: quat
  scale?: vec3
  translation?: vec3
}

export interface Mesh {
  primitives: Primitive[]
}

export enum PrimitiveMode {
  Points = 0,
  Lines = 1,
  LineLoop = 2,
  LineStrip = 3,
  Triangles = 4,
  TriangleStrip = 5,
  TriangleFan = 6,
}

export enum PrimitiveAttribute {
  Position = 'POSITION',
  Normal = 'NORMAL',
}

export interface Primitive {
  attributes: {
    [name: string]: number
  }
  indices?: id
  mode?: PrimitiveMode
}

export enum AccessorType {
  Scalar = 'SCALAR',
  Vec2 = 'VEC2',
  Vec3 = 'VEC3',
  Vec4 = 'VEC4',
  Mat2 = 'MAT2',
  Mat3 = 'MAT3',
  Mat4 = 'MAT4',
}

export interface Accessor {
  type: AccessorType
  componentType: ArrayDataType
  count: number
  bufferView?: id
  byteOffset?: number
  min?: number[]
  max?: number[]
}

export interface BufferView {
  buffer: id
  byteOffset?: number
  byteLength: number
  byteStride?: number
}

export interface Buffer {
  uri?: string
  byteLength: number
}
