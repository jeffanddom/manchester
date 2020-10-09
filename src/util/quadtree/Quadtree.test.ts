import { vec2 } from 'gl-matrix'

import { minBiasAabbContains } from './helpers'
import { Quadtree } from './Quadtree'

describe('Quadtree', () => {
  test('basic usage', () => {
    const items: vec2[] = [
      [0.5, 1.5],
      [1.5, 1.5],
      [0.5, 2.5],
      [1.5, 2.5],
      [3.5, 1.5],
      [3.5, 2.5],
      [1, 4],
      [3, 4],
    ]

    const qt = new Quadtree<vec2>({
      maxItems: 2,
      aabb: [
        [0, 1],
        [4, 5],
      ],
      comparator: minBiasAabbContains,
    })

    for (const i of items) {
      qt.insert(i)
    }

    // single item, 2 levels deep
    const q0 = qt.query([
      [0, 1],
      [1, 2],
    ])
    expect(q0.length).toBe(1)
    expect(q0).toContain(items[0])

    // single item, 1 level deep
    const q1 = qt.query([
      [2.5, 3.5],
      [3.5, 4.5],
    ])
    expect(q1.length).toBe(1)
    expect(q1).toContain(items[7])

    // two items in horizontally adjacent nodes
    const q2 = qt.query([
      [0, 1],
      [2, 2],
    ])
    expect(q2.length).toBe(2)
    expect(q2).toContain(items[0])
    expect(q2).toContain(items[1])

    // two items in vertically adjacent nodes
    const q3 = qt.query([
      [0, 1],
      [1, 3],
    ])
    expect(q3.length).toBe(2)
    expect(q3).toContain(items[0])
    expect(q3).toContain(items[2])

    // two items in the same node
    const q4 = qt.query([
      [3.25, 1.25],
      [3.75, 2.75],
    ])
    expect(q4.length).toBe(2)
    expect(q4).toContain(items[4])
    expect(q4).toContain(items[5])

    // two items at different levels
    const q5 = qt.query([
      [1.25, 2.25],
      [3.25, 4.25],
    ])
    expect(q5.length).toBe(2)
    expect(q5).toContain(items[3])
    expect(q5).toContain(items[7])

    // no items, two levels deep
    const q6 = qt.query([
      [0.75, 1.75],
      [1.25, 2.25],
    ])
    expect(q6.length).toBe(0)

    // no items, multiple levels
    const q7 = qt.query([
      [1.75, 2.75],
      [2.25, 3.25],
    ])
    expect(q7.length).toBe(0)

    // no items, outside quadtree area
    const q8 = qt.query([
      [5, 6],
      [6, 7],
    ])
    expect(q8.length).toBe(0)
  })
})
