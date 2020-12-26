import { vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'
import { Aabb2 } from '~/util/aabb2'

export type Hitbox = {
  offset: vec2
  dimensions: vec2
}

export function aabb(h: Immutable<Hitbox>, position: Immutable<vec2>): Aabb2 {
  const offsetPosition = vec2.add(vec2.create(), h.offset, position)

  return [
    offsetPosition,
    vec2.fromValues(
      offsetPosition[0] + h.dimensions[0],
      offsetPosition[1] + h.dimensions[1],
    ),
  ]
}

export function clone(h: Immutable<Hitbox>): Hitbox {
  return { offset: vec2.clone(h.offset), dimensions: vec2.clone(h.dimensions) }
}
