import { vec2 } from 'gl-matrix'

import { segmentSegment } from './collision'

test('perpendicular, intersecting, neither vertical', () => {
  const segment1: [vec2, vec2] = [
    vec2.fromValues(-1, -1),
    vec2.fromValues(1, 1),
  ]
  const segment2: [vec2, vec2] = [
    vec2.fromValues(1, -1),
    vec2.fromValues(-1, 1),
  ]
  expect(segmentSegment(segment1, segment2)).toBe(true)
  expect(segmentSegment(segment2, segment1)).toBe(true)
})

test('pependicular, non-intersecting, neither vertical', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(2, 2), vec2.fromValues(3, 3)]
  const segment2: [vec2, vec2] = [
    vec2.fromValues(1, -1),
    vec2.fromValues(-1, 1),
  ]
  expect(segmentSegment(segment1, segment2)).toBe(false)
  expect(segmentSegment(segment2, segment1)).toBe(false)
})

test('colinear vertical overlapping', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(1, 1), vec2.fromValues(1, 4)]
  const segment2: [vec2, vec2] = [vec2.fromValues(1, 2), vec2.fromValues(1, 3)]
  expect(segmentSegment(segment1, segment2)).toBe(true)
  expect(segmentSegment(segment2, segment1)).toBe(true)
})

test('colinear vertical nonoverlapping', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(1, 1), vec2.fromValues(1, 4)]
  const segment2: [vec2, vec2] = [vec2.fromValues(1, 5), vec2.fromValues(1, 6)]
  expect(segmentSegment(segment1, segment2)).toBe(false)
  expect(segmentSegment(segment2, segment1)).toBe(false)
})

test('vertical not overlapping on x', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(1, 1), vec2.fromValues(1, 4)]
  const segment2: [vec2, vec2] = [vec2.fromValues(2, 1), vec2.fromValues(2, 4)]
  expect(segmentSegment(segment1, segment2)).toBe(false)
  expect(segmentSegment(segment2, segment1)).toBe(false)
})

test('one horizontal, one 45 degree, intersecting', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(-1, 0), vec2.fromValues(1, 0)]
  const segment2: [vec2, vec2] = [
    vec2.fromValues(1, -1),
    vec2.fromValues(-1, 1),
  ]
  expect(segmentSegment(segment1, segment2)).toBe(true)
  expect(segmentSegment(segment2, segment1)).toBe(true)
})

test('parallel 45 degree lines', () => {
  const segment1: [vec2, vec2] = [
    vec2.fromValues(-1, -1),
    vec2.fromValues(1, 1),
  ]
  const segment2: [vec2, vec2] = [vec2.fromValues(-1, 0), vec2.fromValues(1, 2)]

  expect(segmentSegment(segment1, segment2)).toBe(false)
  expect(segmentSegment(segment2, segment1)).toBe(false)
})

test('colinear, non-axis aligned, overlapping line segment', () => {
  const segment1: [vec2, vec2] = [
    vec2.fromValues(-1, -1),
    vec2.fromValues(1, 1),
  ]
  const segment2: [vec2, vec2] = [
    vec2.fromValues(-5, -5),
    vec2.fromValues(5, 5),
  ]

  expect(segmentSegment(segment1, segment2)).toBe(true)
  expect(segmentSegment(segment2, segment1)).toBe(true)
})

test('colinear, non-axis aligned, semi-overlapping line segment', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(0, 0), vec2.fromValues(2, 2)]
  const segment2: [vec2, vec2] = [vec2.fromValues(1, 1), vec2.fromValues(3, 3)]

  expect(segmentSegment(segment1, segment2)).toBe(true)
  expect(segmentSegment(segment2, segment1)).toBe(true)
})

test('colinear, non-axis aligned, non-overlapping line segment', () => {
  const segment1: [vec2, vec2] = [vec2.fromValues(0, 0), vec2.fromValues(2, 2)]
  const segment2: [vec2, vec2] = [vec2.fromValues(3, 3), vec2.fromValues(5, 5)]

  expect(segmentSegment(segment1, segment2)).toBe(false)
  expect(segmentSegment(segment2, segment1)).toBe(false)
})
