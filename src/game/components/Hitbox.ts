import { vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'
import { Aabb2 } from '~/util/aabb2'

export type Hitbox = {
  offset: vec2
  dimensions: vec2
}

export function aabb(h: Immutable<Hitbox>, position: Immutable<vec2>): Aabb2 {
  const x1 = h.offset[0] + position[0]
  const y1 = h.offset[1] + position[1]
  return [x1, y1, x1 + h.dimensions[0], y1 + h.dimensions[1]]
}

export function clone(h: Immutable<Hitbox>): Hitbox {
  return { offset: vec2.clone(h.offset), dimensions: vec2.clone(h.dimensions) }
}
