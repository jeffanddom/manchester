import { vec4 } from 'gl-matrix'

import { ModelModifiers } from '~/renderer/interfaces'

export interface EntityModel {
  name: string
  color: vec4
  modifiers: ModelModifiers
}
