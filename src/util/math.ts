import { vec2 } from 'gl-matrix'

import { Transform } from '~/entities/components/Transform'

export const clamp = (v: number, range: [number, number]): number => {
  return Math.min(Math.max(range[0], v), range[1])
}

export const clamp2 = (out: vec2, v: vec2, range: [vec2, vec2]): vec2 => {
  return vec2.min(out, vec2.max(out, v, range[0]), range[1])
}

export const lerp = (min: number, max: number, alpha: number): number => {
  return min + alpha * (max - min)
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

export const aabbOverlap = (a: [vec2, vec2], b: [vec2, vec2]) => {
  return (
    a[0][0] <= b[1][0] &&
    a[1][0] >= b[0][0] &&
    a[0][1] <= b[1][1] &&
    a[1][1] >= b[0][1]
  )
}

export const normalizeAngle = (theta: number): number => {
  if (theta > Math.PI) {
    return theta - 2 * Math.PI
  } else if (theta < -Math.PI) {
    return theta + 2 * Math.PI
  }
  return theta
}

export const getAngle = (from: vec2, to: vec2): number => {
  const offset = vec2.sub(vec2.create(), to, from)
  return Math.sign(offset[0]) * vec2.angle(vec2.fromValues(0, -1), offset)
}

export const getAngularDistance = (from: Transform, to: Transform): number => {
  const targetOrientation = getAngle(from.position, to.position)
  return normalizeAngle(targetOrientation - from.orientation)
}
