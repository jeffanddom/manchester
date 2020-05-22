import { vec2 } from 'gl-matrix'

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
