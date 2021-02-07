import * as aabb2 from '../aabb2'
import { Aabb2 } from '../aabb2'

test('size', () => {
  expect(aabb2.size([1, 2, 3, 4])).toStrictEqual([2, 2])
})

test('centerSize', () => {
  expect(aabb2.centerSize([1, 2, 3, 4])).toStrictEqual([
    [2, 3],
    [2, 2],
  ])
})

test('overlap', () => {
  const cases: [Aabb2, Aabb2, boolean][] = [
    [[1, 2, 3, 4], [1, 2, 3, 4], true], // same AABB
    [[1, 2, 3, 4], [2, 3, 5, 6], true], // SE/NW corner overlap
    [[1, 2, 3, 4], [2, 1, 4, 3], true], // NE/SW corner overlap
    [[1, 2, 3, 4], [3, 4, 5, 6], true], // SE/NW corner touch
    [[1, 2, 3, 4], [3, 1, 4, 2], true], // NE/SW corner touch
    [[1, 2, 3, 4], [0, 1, 4, 5], true], // full enclosure
    [[1, 2, 3, 4], [0, 3, 4, 5], true], // enclosing north/south
    [[1, 2, 3, 4], [2, 1, 4, 5], true], // enclosing east/west
    [[1, 2, 3, 4], [1, 5, 3, 7], false], // disjoint north/south
    [[1, 2, 3, 4], [5, 2, 7, 4], false], // disjoint east/west
    [[1, 2, 3, 4], [4, 5, 6, 7], false], // disjoint se/nw
    [[1, 2, 3, 4], [4, -1, 6, 1], false], // disjoint ne/sw
  ]

  for (const [a, b, want] of cases) {
    expect(aabb2.overlap(a, b)).toBe(want)
    expect(aabb2.overlap(b, a)).toBe(want)
  }
})

test('overlapArea', () => {
  const cases: [Aabb2, Aabb2, number][] = [
    [[1, 2, 3, 4], [1, 2, 3, 4], 4], // same AABB
    [[1, 2, 3, 4], [2, 3, 5, 6], 1], // SE/NW corner overlap
    [[1, 2, 3, 4], [2, 1, 4, 3], 1], // NE/SW corner overlap
    [[1, 2, 3, 4], [3, 4, 5, 6], 0], // SE/NW corner touch
    [[1, 2, 3, 4], [3, 1, 4, 2], 0], // NE/SW corner touch
    [[1, 2, 3, 4], [0, 1, 4, 5], 4], // full enclosure
    [[1, 2, 3, 4], [0, 3, 4, 5], 2], // enclosing north/south
    [[1, 2, 3, 4], [2, 1, 4, 5], 2], // enclosing east/west
    [[1, 2, 3, 4], [1, 5, 3, 7], 0], // disjoint north/south
    [[1, 2, 3, 4], [5, 2, 7, 4], 0], // disjoint east/west
    [[1, 2, 3, 4], [4, 5, 6, 7], 0], // disjoint se/nw
    [[1, 2, 3, 4], [4, -1, 6, 1], 0], // disjoint ne/sw
  ]

  for (const [a, b, want] of cases) {
    expect(aabb2.overlapArea(a, b)).toBe(want)
    expect(aabb2.overlapArea(b, a)).toBe(want)
  }
})
