import { mat2d, vec2 } from 'gl-matrix'
import { max } from 'lodash'

export const clamp = (v: number, range: [number, number]): number => {
  return Math.min(Math.max(range[0], v), range[1])
}

export const clamp2 = (out: vec2, v: vec2, range: [vec2, vec2]): vec2 => {
  return vec2.min(out, vec2.max(out, v, range[0]), range[1])
}

export const lerp = (min: number, max: number, alpha: number): number => {
  return min + alpha * (max - min)
}

export const inverseLerp = (min: number, max: number, pos: number): number => {
  return (pos - min) / (max - min)
}

/**
 * Translate vector start by amount in a direction indicated by orientation.
 * orientation is interpreted as clockwise radians from north (negative y).
 */
export const radialTranslate2 = (
  out: vec2,
  start: vec2,
  orientation: number,
  amount: number,
): vec2 => {
  return vec2.add(
    out,
    start,
    vec2.rotate(vec2.create(), [0, -amount], [0, 0], orientation),
  )
}

export const aabbOverlap = (a: [vec2, vec2], b: [vec2, vec2]): boolean => {
  return (
    a[0][0] <= b[1][0] &&
    a[1][0] >= b[0][0] &&
    a[0][1] <= b[1][1] &&
    a[1][1] >= b[0][1]
  )
}

export const aabbOverlapArea = (a: [vec2, vec2], b: [vec2, vec2]): number => {
  return (
    Math.max(0, Math.min(a[1][0], b[1][0]) - Math.max(a[0][0], b[0][0])) *
    Math.max(0, Math.min(a[1][1], b[1][1]) - Math.max(a[0][1], b[0][1]))
  )
}

export const getAngle = (from: vec2, to: vec2): number => {
  const offset = vec2.sub(vec2.create(), to, from)
  return Math.sign(offset[0]) * vec2.angle(vec2.fromValues(0, -1), offset)
}

const normalizeAngle = (theta: number): number => {
  if (theta > Math.PI) {
    return theta - 2 * Math.PI
  } else if (theta < -Math.PI) {
    return theta + 2 * Math.PI
  }
  return theta
}

export const rotateUntil = (params: {
  from: number
  to: number
  amount: number
}): number => {
  const { from, to, amount } = params
  const diff = normalizeAngle(normalizeAngle(to) - normalizeAngle(from))

  return normalizeAngle(
    from + (amount >= Math.abs(diff) ? diff : Math.sign(diff) * amount),
  )
}

export const vec2FromValuesBatch = (raw: [number, number][]): Array<vec2> => {
  return raw.map((r) => vec2.fromValues(r[0], r[1]))
}

/**
 * Applies uniform scaling and translation to a circle. This will not perform
 * skew or rotation.
 */
export const transformCircle = (
  { pos, radius }: { pos: vec2; radius: number },
  transform: mat2d,
): { pos: vec2; radius: number } => {
  const center = vec2.transformMat2d(vec2.create(), pos, transform)
  const edge = vec2.create()
  vec2.transformMat2d(
    edge,
    vec2.add(edge, pos, vec2.fromValues(radius, 0)),
    transform,
  )

  return {
    pos: center,
    radius: vec2.length(vec2.sub(edge, edge, center)),
  }
}
