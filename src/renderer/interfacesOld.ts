import { ModelPrimitive } from './interfaces'

export type ModelDef = {
  primitive: ModelPrimitive
  positions: Float32Array
  colors?: Float32Array
  normals?: Float32Array
}
