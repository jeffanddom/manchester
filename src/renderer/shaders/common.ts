export enum ShaderAttribLoc {
  Position = 0,
  Normal = 1,
  Color = 2,
  EdgeOn = 3,
}

/**
 * The values of this enum should match the identifiers used in shader source.
 */
export enum ShaderUniform {
  Projection = 'projection',
  World2View = 'world2View',
  Model2World = 'model2World',
  Color = 'color',
}
