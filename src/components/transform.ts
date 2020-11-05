import { mat2d, vec2 } from 'gl-matrix'

export interface ITransform {
  previousPosition: vec2
  position: vec2
  orientation: number
}

export const toMWTransform = (transform: ITransform): mat2d => {
  const t = mat2d.fromTranslation(mat2d.create(), transform.position)
  const r = mat2d.fromRotation(mat2d.create(), transform.orientation)
  return mat2d.multiply(mat2d.create(), t, r)
}

export const make = (): ITransform => ({
  previousPosition: vec2.create(),
  position: vec2.create(),
  orientation: 0,
})

export const clone = (src: ITransform): ITransform => ({
  previousPosition: vec2.clone(src.previousPosition),
  position: vec2.clone(src.position),
  orientation: src.orientation,
})
