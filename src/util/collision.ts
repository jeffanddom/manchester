import { vec2 } from 'gl-matrix'

// ax = c
//  x = c / a

// [1, 1], [1, 2] // ax = c

// [2, 1], [2, 2] -> [1, 0, 2]

// How do we go from [p1, p2] to ax + by = c
// y = mx + b
// m -> slope
// b -> offset

// m = (p2.y - p1.y) / (p2.x - p2.x)
// b = p1.y - m * p1.x

// y = mx + b -> ux + vy + w

// y - mx = b

// u = -m
// v = 1
// w = b

const lineFormula = (a: vec2, b: vec2): [number, number, number] => {
  const rise = b[1] - a[1]
  const run = b[0] - a[0]
  if (Math.abs(run) < 0.00005) {
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

export const segmentSegment = (s1: [vec2, vec2], s2: [vec2, vec2]): boolean => {
  const [a, b, c] = lineFormula(s1[0], s1[1])
  const [u, v, w] = lineFormula(s2[0], s2[1])

  // point of intersection
  const y = (w - (u * c) / a) / ((-u * b) / a + v)
  const x = (-b * y + c) / a

  return (
    between(s1[0][0], s1[1][0], x) &&
    between(s1[0][1], s1[1][1], y) &&
    between(s2[0][0], s2[1][0], x) &&
    between(s2[0][1], s2[1][1], y)
  )
}

// ax + by = c
// ux + vy = w

// x = (-by + c) / a

// u * ((-by + c) / a) + vy = w

// (-ub/a)y + uc/a + vy = w

// y(u * -b/a + v) + uc/a = w

// // Point of intersection

// // Is the point on a segment?
// min(x1, x2) <= x <= max(x1, x2)
