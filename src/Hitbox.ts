import { vec2 } from 'gl-matrix'

export class Hitbox {
  offset: vec2
  dimensions: vec2
  shouldRotate: boolean

  constructor(offset: vec2, dimensions: vec2, shouldRotate?: boolean) {
    this.offset = offset
    this.dimensions = dimensions
    this.shouldRotate = shouldRotate === undefined ? true : shouldRotate
  }

  aabb(position: vec2, orientation: number): [vec2, vec2] {
    const rotatedOffset = this.shouldRotate
      ? vec2.rotate(
          vec2.create(),
          this.offset,
          vec2.fromValues(0, 0),
          orientation,
        )
      : vec2.clone(this.offset)
    vec2.add(rotatedOffset, rotatedOffset, position)

    return [
      rotatedOffset,
      vec2.fromValues(
        rotatedOffset[0] + this.dimensions[0],
        rotatedOffset[1] + this.dimensions[1],
      ),
    ]
  }
}
