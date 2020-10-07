import { vec2 } from 'gl-matrix'

import { aabbOverlap } from '../math'

import {
  ChildList,
  Quadrant,
  TNode,
  emptyNode,
  minBiasAabbContains,
  minBiasAabbOverlap,
  nodeInsert,
  nodeQuery,
  quadrantOfAabb,
} from './helpers'

class TestItem {
  _pos: vec2

  constructor(pos: vec2) {
    this._pos = pos
  }

  pos(): vec2 {
    return vec2.clone(this._pos)
  }
}

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

test('minBiasAabbContains', () => {
  const aabb: [vec2, vec2] = [vec2.fromValues(0, 0), vec2.fromValues(1, 1)]
  expect(minBiasAabbContains(aabb, [0.5, 0.5])).toBe(true) // strict interior
  expect(minBiasAabbContains(aabb, [10, 10])).toBe(false) // strict exterior
  expect(minBiasAabbContains(aabb, [0.5, 0])).toBe(true) // north edge
  expect(minBiasAabbContains(aabb, [0, 0.5])).toBe(true) // west edge
  expect(minBiasAabbContains(aabb, [0.5, 1])).toBe(false) // south edge
  expect(minBiasAabbContains(aabb, [1, 0.5])).toBe(false) // east edge
})

describe('minBiasAabbOverlap', () => {
  test('fully disjoint', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [2, 2],
      [3, 3],
    ]
    expect(minBiasAabbOverlap(a, b)).toBe(false)
    expect(minBiasAabbOverlap(b, a)).toBe(false)
  })

  test('full enclosure', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [0.25, 0.25],
      [0.75, 0.75],
    ]
    expect(minBiasAabbOverlap(a, b)).toBe(true)
    expect(minBiasAabbOverlap(b, a)).toBe(true)
  })

  test('partial overlap', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [0.5, 0.5],
      [1.5, 1.5],
    ]
    expect(minBiasAabbOverlap(a, b)).toBe(true)
    expect(minBiasAabbOverlap(b, a)).toBe(true)
  })

  test('shared north edge', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [0.5, 0],
      [1, 0.5],
    ]
    expect(minBiasAabbOverlap(a, b)).toBe(true)
    expect(minBiasAabbOverlap(b, a)).toBe(true)
  })

  test('shared west edge', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [0, 0.5],
      [0.5, 1],
    ]
    expect(minBiasAabbOverlap(a, b)).toBe(true)
    expect(minBiasAabbOverlap(b, a)).toBe(true)
  })

  test('vertically adjacent, no overlap', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [0, 1],
      [1, 2],
    ]

    expect(aabbOverlap(a, b)).toBe(true)
    expect(aabbOverlap(b, a)).toBe(true)
    expect(minBiasAabbOverlap(a, b)).toBe(false)
    expect(minBiasAabbOverlap(b, a)).toBe(false)
  })

  test('horizontally adjacent, no overlap', () => {
    const a: [vec2, vec2] = [
      [0, 0],
      [1, 1],
    ]
    const b: [vec2, vec2] = [
      [1, 0],
      [2, 1],
    ]

    expect(aabbOverlap(a, b)).toBe(true)
    expect(aabbOverlap(b, a)).toBe(true)
    expect(minBiasAabbOverlap(a, b)).toBe(false)
    expect(minBiasAabbOverlap(b, a)).toBe(false)
  })
})

describe('nodeInsert', () => {
  test('insert attempt into non-enclosing node', () => {
    const node = emptyNode()
    nodeInsert(
      node,
      [
        [0, 0],
        [1, 1],
      ],
      1,
      new TestItem([-1, -1]),
    )
    expect(node.items!.length).toBe(0)
  })

  test('insert into node with spare capacity', () => {
    const node = emptyNode()
    const item = new TestItem([0, 0])
    nodeInsert(
      node,
      [
        [0, 0],
        [1, 1],
      ],
      1,
      item,
    )
    expect(node.items!.length).toBe(1)
    expect(node.items![0]).toBe(item)
  })

  test('insert into intermediate node', () => {
    const children: ChildList<TestItem> = [
      emptyNode(),
      emptyNode(),
      emptyNode(),
      emptyNode(),
    ]

    const node: TNode<TestItem> = { children }

    const items = [
      new TestItem([0, 0]),
      new TestItem([1, 0]),
      new TestItem([1, 1]),
      new TestItem([0, 1]),
    ]

    for (const i of items) {
      nodeInsert(
        node,
        [
          [0, 0],
          [2, 2],
        ],
        1,
        i,
      )
    }

    expect(node.items).toBeUndefined()
    expect(node.children![Quadrant.NW].items!.length).toBe(1)
    expect(node.children![Quadrant.NW].items![0]).toBe(items[Quadrant.NW])
    expect(node.children![Quadrant.NE].items!.length).toBe(1)
    expect(node.children![Quadrant.NE].items![0]).toBe(items[Quadrant.NE])
    expect(node.children![Quadrant.SE].items!.length).toBe(1)
    expect(node.children![Quadrant.SE].items![0]).toBe(items[Quadrant.SE])
    expect(node.children![Quadrant.SW].items!.length).toBe(1)
    expect(node.children![Quadrant.SW].items![0]).toBe(items[Quadrant.SW])
  })

  test('insert into node at capacity', () => {
    const items = [
      new TestItem([0.5, 0.5]),
      new TestItem([1.5, 0.5]),
      new TestItem([1.5, 1.5]),
      new TestItem([0.5, 1.5]),
    ]

    const node: TNode<TestItem> = { items: [items[0], items[1], items[2]] }

    nodeInsert(
      node,
      [
        [0, 0],
        [2, 2],
      ],
      3,
      items[3],
    )

    expect(node.items).toBeUndefined()

    expect(node.children!.length).toBe(4)
    expect(node.children![Quadrant.NW].items!.length).toBe(1)
    expect(node.children![Quadrant.NW].items![0]).toBe(items[0])
    expect(node.children![Quadrant.NE].items!.length).toBe(1)
    expect(node.children![Quadrant.NE].items![0]).toBe(items[1])
    expect(node.children![Quadrant.SE].items!.length).toBe(1)
    expect(node.children![Quadrant.SE].items![0]).toBe(items[2])
    expect(node.children![Quadrant.SW].items!.length).toBe(1)
    expect(node.children![Quadrant.SW].items![0]).toBe(items[3])
  })
})

describe('nodeQuery', () => {
  const items = [
    new TestItem([-0.5, -0.5]),
    new TestItem([0.5, -0.5]),
    new TestItem([0.5, 0.5]),
    new TestItem([-0.5, 0.5]),
  ]

  test('no overlap with node AABB', () => {
    expect(
      nodeQuery(
        { items },
        [
          [-1, -1],
          [1, 1],
        ],
        [
          [2, 2],
          [3, 3],
        ],
      ).length,
    ).toBe(0)
  })

  test('no overlap with items', () => {
    expect(
      nodeQuery(
        { items },
        [
          [-1, -1],
          [1, 1],
        ],
        [
          [-0.25, -0.25],
          [0.25, 0.25],
        ],
      ).length,
    ).toBe(0)
  })

  test('no overlap with some items', () => {
    const node = { items }
    const results = nodeQuery(
      node,
      [
        [-1, -1],
        [1, 1],
      ],
      [
        [-0.75, -0.75],
        [0, 1],
      ],
    )
    expect(results.length).toBe(2)
    expect(results[0]).toBe(items[0])
    expect(results[1]).toBe(items[3])
  })
})
