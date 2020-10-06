import { vec2 } from 'gl-matrix'

import {
  ChildList,
  Quadrant,
  Quadtree,
  emptyNode,
  nodeInsert,
  quadrantOfAabb,
} from './Quadtree'

class TestItem {
  _pos: vec2

  constructor(pos: vec2) {
    this._pos = pos
  }

  pos(): vec2 {
    return vec2.clone(this._pos)
  }
}

test('basic usage', () => {
  const qt = new Quadtree<TestItem>({ maxItems: 4 })
  const items = [
    new TestItem(vec2.fromValues(0, 0)),
    new TestItem(vec2.fromValues(1, 1)),
    new TestItem(vec2.fromValues(-1, -1)),
  ]
  for (const i of items) {
    qt.insert(i)
  }

  const r0 = qt.query([vec2.fromValues(-1, -1), vec2.fromValues(1, 1)])
  expect(r0.length).toBe(2)
  expect(r0).toContain(items[0])
  expect(r0).toContain(items[2])

  const r1 = qt.query([vec2.fromValues(-1, -1), vec2.fromValues(1.1, 1.1)])
  expect(r1.length).toBe(3)
  expect(r1).toContain(items[0])
  expect(r1).toContain(items[1])
  expect(r1).toContain(items[2])

  const r2 = qt.query([vec2.fromValues(0, 0), vec2.fromValues(1.1, 1.1)])
  expect(r2.length).toBe(2)
  expect(r2).toContain(items[0])
  expect(r2).toContain(items[1])

  const r3 = qt.query([vec2.fromValues(2, 2), vec2.fromValues(3, 3)])
  expect(r3.length).toBe(0)
})

test('quadrantOfAabb', () => {
  const aabb: [vec2, vec2] = [vec2.fromValues(0, 0), vec2.fromValues(2, 2)]

  const nw = quadrantOfAabb(aabb, Quadrant.NW)
  expect(vec2.equals(nw[0], vec2.fromValues(0, 0))).toBe(true)
  expect(vec2.equals(nw[1], vec2.fromValues(1, 1))).toBe(true)

  const ne = quadrantOfAabb(aabb, Quadrant.NE)
  expect(vec2.equals(ne[0], vec2.fromValues(1, 0))).toBe(true)
  expect(vec2.equals(ne[1], vec2.fromValues(2, 1))).toBe(true)

  const se = quadrantOfAabb(aabb, Quadrant.SE)
  expect(vec2.equals(se[0], vec2.fromValues(1, 1))).toBe(true)
  expect(vec2.equals(se[1], vec2.fromValues(2, 2))).toBe(true)

  const sw = quadrantOfAabb(aabb, Quadrant.SW)
  expect(vec2.equals(sw[0], vec2.fromValues(0, 1))).toBe(true)
  expect(vec2.equals(sw[1], vec2.fromValues(1, 2))).toBe(true)
})

test('nodeInsert', () => {
  // push without any side-effect
  const n0 = emptyNode()
  nodeInsert(
    n0,
    [
      [0, 0],
      [1, 1],
    ],
    1,
    new TestItem([-1, -1]),
  )
  expect(n0.items!.length).toBe(0)

  // push without triggering subdivide
  const n1 = emptyNode()
  const i1 = new TestItem([0, 0])
  nodeInsert(
    n1,
    [
      [0, 0],
      [1, 1],
    ],
    1,
    i1,
  )
  expect(n1.items!.length).toBe(1)
  expect(n1.items![0]).toBe(i1)

  // push into already subdivided
  const children2: ChildList<TestItem> = [
    emptyNode(),
    emptyNode(),
    emptyNode(),
    emptyNode(),
  ]
  const n2 = {
    children: children2,
  }
  const items2 = [
    new TestItem([0, 0]),
    new TestItem([1, 0]),
    new TestItem([1, 1]),
    new TestItem([0, 1]),
  ]
  for (const i of items2) {
    nodeInsert(
      n2,
      [
        [0, 0],
        [2, 2],
      ],
      1,
      i,
    )
  }
  expect(n2.children[Quadrant.NW].items!.length).toBe(1)
  expect(n2.children[Quadrant.NW].items![0]).toBe(items2[Quadrant.NW])
  expect(n2.children[Quadrant.NE].items!.length).toBe(1)
  expect(n2.children[Quadrant.NE].items![0]).toBe(items2[Quadrant.NE])
  expect(n2.children[Quadrant.SE].items!.length).toBe(1)
  expect(n2.children[Quadrant.SE].items![0]).toBe(items2[Quadrant.SE])
  expect(n2.children[Quadrant.SW].items!.length).toBe(1)
  expect(n2.children[Quadrant.SW].items![0]).toBe(items2[Quadrant.SW])

  // push and trigger subdivide
})
