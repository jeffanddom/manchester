import { glMatrix, vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'
import * as aabb2 from '~/util/aabb2'

const aabbFromSegment = (s: Immutable<[vec2, vec2]>): [vec2, vec2] => {
  const northwest = vec2.fromValues(
    Math.min(s[0][0], s[1][0]),
    Math.min(s[0][1], s[1][1]),
  )
  const southeast = vec2.fromValues(
    Math.max(s[0][0], s[1][0]),
    Math.max(s[0][1], s[1][1]),
  )
  return [northwest, southeast]
}

const crossScalar = (v: vec2, w: vec2): number => {
  return v[0] * w[1] - v[1] * w[0]
}

// From https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
export const segmentSegment = (
  s1: Immutable<[vec2, vec2]>,
  s2: Immutable<[vec2, vec2]>,
): boolean => {
  const p = s1[0]
  const r = vec2.sub(vec2.create(), s1[1], s1[0])

  const q = s2[0]
  const s = vec2.sub(vec2.create(), s2[1], s2[0])

  const divisor = crossScalar(r, s)
  const un = crossScalar(vec2.subtract(vec2.create(), q, p), r)

  if (glMatrix.equals(divisor, 0)) {
    if (glMatrix.equals(un, 0)) {
      // colinear
      return aabb2.overlap(aabbFromSegment(s1), aabbFromSegment(s2))
    } else {
      // parallel, no colinear
      return false
    }
  } else {
    const tn = crossScalar(vec2.subtract(vec2.create(), q, p), s)
    const t = tn / divisor
    const u = un / divisor

    return 0 <= u && u <= 1 && 0 <= t && t <= 1
  }
}

export const segmentToAabb = (
  s: Immutable<[vec2, vec2]>,
  aabb: Immutable<[vec2, vec2]>,
): boolean => {
  const nw = vec2.fromValues(aabb[0][0], aabb[0][1])
  const ne = vec2.fromValues(aabb[1][0], aabb[0][1])
  const sw = vec2.fromValues(aabb[0][0], aabb[1][1])
  const se = vec2.fromValues(aabb[1][0], aabb[1][1])

  return (
    segmentSegment(s, [nw, ne]) ||
    segmentSegment(s, [sw, se]) ||
    segmentSegment(s, [nw, sw]) ||
    segmentSegment(s, [ne, se])
  )
}
