import { vec2, mat2d } from 'gl-matrix'

export class Transform {
  previousPosition: vec2
  position: vec2
  orientation: number

  constructor() {
    this.previousPosition = vec2.create()
    this.position = vec2.create()
    this.orientation = 0
  }

  update() {
    this.previousPosition = vec2.clone(this.position)
  }

  /**
   * Returns a transform matrix mapping modelspace positions to worldspace
   * positions.
   */
  mwTransform(): mat2d {
    const t = mat2d.fromTranslation(mat2d.create(), this.position)
    const r = mat2d.fromRotation(mat2d.create(), this.orientation)
    return mat2d.multiply(mat2d.create(), t, r)
  }
}
