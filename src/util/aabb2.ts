import { Immutable } from '~/types/immutable'

// x1, y1, x2, y2
export type Aabb2 = [number, number, number, number]

export enum Elem {
  x1,
  y1,
  x2,
  y2,
}

export function create(): Aabb2 {
  return [0, 0, 0, 0]
}

export function size(aabb: Immutable<Aabb2>): [number, number] {
  return [aabb[Elem.x2] - aabb[Elem.x1], aabb[Elem.y2] - aabb[Elem.y1]]
}

/**
 * Decompose an AABB into a center point and a size (width/height).
 */
export function centerSize(
  aabb: Immutable<Aabb2>,
): [[number, number], [number, number]] {
  const s = size(aabb)
  return [[aabb[Elem.x1] + s[0] / 2, aabb[Elem.y1] + s[1] / 2], s]
}

export const overlap = (a: Immutable<Aabb2>, b: Immutable<Aabb2>): boolean => {
  return (
    a[Elem.x1] <= b[Elem.x2] &&
    a[Elem.x2] >= b[Elem.x1] &&
    a[Elem.y1] <= b[Elem.y2] &&
    a[Elem.y2] >= b[Elem.y1]
  )
}

export const overlapArea = (
  a: Immutable<Aabb2>,
  b: Immutable<Aabb2>,
): number => {
  return (
    Math.max(
      0,
      Math.min(a[Elem.x2], b[Elem.x2]) - Math.max(a[Elem.x1], b[Elem.x1]),
    ) *
    Math.max(
      0,
      Math.min(a[Elem.y2], b[Elem.y2]) - Math.max(a[Elem.y1], b[Elem.y1]),
    )
  )
}
