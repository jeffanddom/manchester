import { vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export class Hitbox {
  offset: vec2
  dimensions: vec2

  constructor(offset: vec2, dimensions: vec2) {
    this.offset = offset
    this.dimensions = dimensions
  }

  aabb(position: Immutable<vec2>): [vec2, vec2] {
    const offsetPosition = vec2.add(vec2.create(), this.offset, position)

    return [
      offsetPosition,
      vec2.fromValues(
        offsetPosition[0] + this.dimensions[0],
        offsetPosition[1] + this.dimensions[1],
      ),
    ]
  }

  clone(): Hitbox {
    return new Hitbox(vec2.clone(this.offset), vec2.clone(this.dimensions))
  }
}
