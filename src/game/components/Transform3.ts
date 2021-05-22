import { quat, vec3 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export interface Transform3 {
  previousPosition: vec3
  position: vec3
  orientation: quat
}

export const make = (): Transform3 => ({
  previousPosition: vec3.create(),
  position: vec3.create(),
  orientation: quat.create(),
})

export const clone = (src: Immutable<Transform3>): Transform3 => ({
  previousPosition: vec3.clone(src.previousPosition),
  position: vec3.clone(src.position),
  orientation: quat.clone(src.orientation),
})
