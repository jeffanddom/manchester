export enum ModelPrimitive {
  Lines,
  Triangles,
}

export type ModelDef = {
  primitive: ModelPrimitive
  positions: Float32Array
  colors?: Float32Array
  normals?: Float32Array
}
