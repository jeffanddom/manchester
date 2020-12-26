import { vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type Aabb2 = [vec2, vec2]

export function size(aabb: Immutable<Aabb2>): vec2 {
  return vec2.fromValues(aabb[1][0] - aabb[0][0], aabb[1][0] - aabb[0][0])
}

export function centerSize(aabb: Immutable<Aabb2>): [vec2, vec2] {
  const s = size(aabb)
  return [vec2.fromValues(aabb[0][0] + s[0] / 2, aabb[0][1] + s[1] / 2), s]
}

export const overlap = (a: Immutable<Aabb2>, b: Immutable<Aabb2>): boolean => {
  return (
    a[0][0] <= b[1][0] &&
    a[1][0] >= b[0][0] &&
    a[0][1] <= b[1][1] &&
    a[1][1] >= b[0][1]
  )
}

export const overlapArea = (
  a: Immutable<Aabb2>,
  b: Immutable<Aabb2>,
): number => {
  return (
    Math.max(0, Math.min(a[1][0], b[1][0]) - Math.max(a[0][0], b[0][0])) *
    Math.max(0, Math.min(a[1][1], b[1][1]) - Math.max(a[0][1], b[0][1]))
  )
}
