import { mat2d, vec2, vec3 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export type SphereCoord = [number, number, number] // [r, theta, phi]

export function sphereCoordFromValues(
  r: number, // radius
  theta: number, // inclination
  phi: number, // azimuth
): SphereCoord {
  return [r, theta, phi]
}

/**
 * This function treats +Y as the vertical axis, and +X/+Z as the ground plane.
 * In other words, theta is the rotation away from +Y toward the +X/+Z plane,
 * and phi is the rotation around +Y with zero as +Z.
 *
 * https://en.wikipedia.org/wiki/Spherical_coordinate_system#Cartesian_coordinates
 */
export function sphereCoordToVec3(
  out: vec3,
  coord: Immutable<SphereCoord>,
): vec3 {
  const rSinTheta = coord[0] * Math.sin(coord[1])
  out[0] = rSinTheta * Math.sin(coord[2]) // r * sin(theta) * sin(phi)
  out[1] = coord[0] * Math.cos(coord[1]) // r * cos(theta)
  out[2] = rSinTheta * Math.cos(coord[2]) // r *  sin(theta) * cos(phi)
  return out
}

export const clamp = (v: number, min: number, max: number): number => {
  if (v < min) {
    return min
  }

  if (v > max) {
    return max
  }

  return v
}

export const clamp2 = (
  out: vec2,
  v: Immutable<vec2>,
  range: Immutable<[vec2, vec2]>,
): vec2 => {
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
  start: Immutable<vec2>,
  orientation: number,
  amount: number,
): vec2 => {
  return vec2.add(
    out,
    start,
    vec2.rotate(vec2.create(), [0, -amount], [0, 0], orientation),
  )
}

export const getAngle = (
  from: Immutable<vec2>,
  to: Immutable<vec2>,
): number => {
  const offset = vec2.sub(vec2.create(), to, from)
  return Math.sign(offset[0]) * vec2.angle(vec2.fromValues(0, -1), offset)
}

export const normalizeAngle = (theta: number): number => {
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

/**
 * Convert radians to degrees
 */
export function r2d(radians: number): number {
  return (radians * 180) / Math.PI
}

export function vec3toFixedString(
  v: Immutable<vec3>,
  decimals: number,
): string {
  return `(${v[0].toFixed(decimals)}, ${v[1].toFixed(decimals)}, ${v[2].toFixed(
    decimals,
  )})`
}

/**
 * Translate a screenspace position (relative to the upper-left corner of the
 * viewport) to a viewspace position. The absolute value of the z-distance of
 * this point is equivalent to the focal length.
 *
 * See: "Picking", chapter 6.6 Van Verth and Bishop, 2nd ed.
 */
export function screenToView(
  screenPos: Immutable<vec2>,
  viewportDimensions: Immutable<vec2>,
  focalLength: number,
): vec3 {
  const w = viewportDimensions[0]
  const h = viewportDimensions[1]

  return vec3.fromValues(
    (2 * (screenPos[0] - w / 2)) / h,
    (-2 * (screenPos[1] - h / 2)) / h,
    -focalLength,
  )
}

export function fovToFocalLength(fov: number): number {
  return 1 / Math.tan(fov / 2)
}
