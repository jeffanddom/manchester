import { mat2d, vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export interface Transform {
  previousPosition: vec2
  position: vec2
  orientation: number
}

export const toMWTransform = (transform: Immutable<Transform>): mat2d => {
  const t = mat2d.fromTranslation(mat2d.create(), transform.position)
  const r = mat2d.fromRotation(mat2d.create(), transform.orientation)
  return mat2d.multiply(mat2d.create(), t, r)
}

export const make = (): Transform => ({
  previousPosition: vec2.create(),
  position: vec2.create(),
  orientation: 0,
})

export const clone = (src: Immutable<Transform>): Transform => ({
  previousPosition: vec2.clone(src.previousPosition),
  position: vec2.clone(src.position),
  orientation: src.orientation,
})
