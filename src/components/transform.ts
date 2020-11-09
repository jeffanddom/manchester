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

export class TransformComponent implements ITransform {
  public previousPosition: vec2
  public position: vec2
  public orientation: number

  constructor() {
    this.previousPosition = vec2.create()
    this.position = vec2.create()
    this.orientation = 0
  }

  clone(): TransformComponent {
    const cloned = new TransformComponent()
    cloned.previousPosition = vec2.clone(this.previousPosition)
    cloned.position = vec2.clone(this.position)
    cloned.orientation = this.orientation
    return cloned
  }
}
