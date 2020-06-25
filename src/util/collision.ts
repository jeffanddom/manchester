import { glMatrix, vec2 } from 'gl-matrix'

import { aabbOverlap } from '~/util/math'

const lineFormula = (a: vec2, b: vec2): [number, number, number] => {
  const rise = b[1] - a[1]
  const run = b[0] - a[0]
  if (glMatrix.equals(run, 0)) {
    return [1, 0, a[0]]
  }

  const slope = rise / run
  const yint = a[1] - slope * a[0]

  return [-slope, 1, yint]
}

const minmax = (a: number, b: number): [number, number] => {
  if (a < b) {
    return [a, b]
  } else {
    return [b, a]
  }
}

const between = (a: number, b: number, v: number): boolean => {
  const [min, max] = minmax(a, b)
  return min < v && v < max
}

const aabbFromSegment = (s: [vec2, vec2]): [vec2, vec2] => {
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

export const segmentSegment = (s1: [vec2, vec2], s2: [vec2, vec2]): boolean => {
  if (!aabbOverlap(aabbFromSegment(s1), aabbFromSegment(s2))) {
    return false
  }

  const [a, b, c] = lineFormula(s1[0], s1[1])
  const [u, v, w] = lineFormula(s2[0], s2[1])

  // One or more line segments is vertical or horizontal
  if (
    glMatrix.equals(a, 0) ||
    glMatrix.equals(b, 0) ||
    glMatrix.equals(u, 0) ||
    glMatrix.equals(v, 0)
  ) {
    return true
  }

  // Multiple point of intersection (same line)
  const divisor = (-u * b) / a + v
  if (glMatrix.equals(divisor, 0)) {
    // Lines are colinear
    if (
      glMatrix.equals(a, u) &&
      glMatrix.equals(b, v) &&
      glMatrix.equals(c, w)
    ) {
      return true
    }

    return false
  }

  // Point of intersection
  const y = (w - (u * c) / a) / divisor
  const x = (-b * y + c) / a

  return (
    between(s1[0][0], s1[1][0], x) &&
    between(s1[0][1], s1[1][1], y) &&
    between(s2[0][0], s2[1][0], x) &&
    between(s2[0][1], s2[1][1], y)
  )
}

export const segmentToAabb = (s: [vec2, vec2], aabb: [vec2, vec2]): boolean => {
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
