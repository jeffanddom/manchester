export enum ShaderAttrib {
  Position = 0,
  Normal = 1,
  VertexColor = 2,
  EdgeOn = 3, // used by wiresolid shader

  // Instance attribs
  InstanceTranslation = 4, // vec3
  InstancePreRotation = 5, // vec4 (quat)
  InstancePostRotation = 6, // vec4 (quat)
  InstanceScale = 7, // vec3
  InstanceColor = 8, // vec3 or vec4
  InstanceActive = 9,
}

export function attribName(attrib: ShaderAttrib): string {
  switch (attrib) {
    case ShaderAttrib.Position:
      return 'aPosition'
    case ShaderAttrib.Normal:
      return 'aNormal'
    case ShaderAttrib.VertexColor:
      return 'aVertexColor'
    case ShaderAttrib.EdgeOn:
      return 'aEdgeOn'
    case ShaderAttrib.InstanceTranslation:
      return 'aInstanceTranslation'
    case ShaderAttrib.InstancePreRotation:
      return 'aInstancePreRotation'
    case ShaderAttrib.InstancePostRotation:
      return 'aInstancePostRotation'
    case ShaderAttrib.InstanceScale:
      return 'aInstanceScale'
    case ShaderAttrib.InstanceColor:
      return 'aInstanceColor'
    case ShaderAttrib.InstanceActive:
      return 'aInstanceActive'
    default:
      throw `unknown attribute: ${attrib}`
  }
}

/**
 * The values of this enum should match the identifiers used in shader source.
 */
export enum ShaderUniform {
  Projection = 'uProjection',
  World2View = 'uWorld2View',
  Model2World = 'uModel2World',
  Color = 'uColor',
}
