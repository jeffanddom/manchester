import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Quadtree } from '~/util/quadtree'
import {
  minBiasAabbContains,
  minBiasAabbOverlap,
} from '~/util/quadtree/helpers'
import { tileBox } from '~/util/tileMath'

type TestItem = {
  id: string
  pos: vec2
}

const testComparator = (aabb: [vec2, vec2], item: TestItem): boolean => {
  return minBiasAabbContains(aabb, item.pos)
}

describe('Quadtree', () => {
  test('basic usage', () => {
    const items: TestItem[] = [
      { id: 'a', pos: vec2.fromValues(0.5, 1.5) },
      { id: 'a', pos: vec2.fromValues(1.5, 1.5) },
      { id: 'a', pos: vec2.fromValues(0.5, 2.5) },
      { id: 'a', pos: vec2.fromValues(1.5, 2.5) },
      { id: 'a', pos: vec2.fromValues(3.5, 1.5) },
      { id: 'a', pos: vec2.fromValues(3.5, 2.5) },
      { id: 'a', pos: vec2.fromValues(1, 4) },
      { id: 'a', pos: vec2.fromValues(3, 4) },
    ]

    const qt = new Quadtree<TestItem>({
      maxItems: 2,
      aabb: [
        [0, 1],
        [4, 5],
      ],
      comparator: testComparator,
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

  test('complex usage', () => {
    const entities: { [key: string]: vec2 } = {}
    const squareDimension = 16

    // Set up QT
    const origin = vec2.fromValues(
      -TILE_SIZE * (squareDimension / 2),
      -TILE_SIZE * (squareDimension / 2),
    )
    const qt = new Quadtree<{ id: string }>({
      maxItems: 4,
      aabb: [
        origin,
        [TILE_SIZE * (squareDimension / 2), TILE_SIZE * (squareDimension / 2)],
      ],
      comparator: (aabb: [vec2, vec2], item: { id: string }) => {
        const entityPos = entities[item.id]
        const entityAabb = tileBox(entityPos)
        return minBiasAabbOverlap(aabb, entityAabb)
      },
    })

    // Register one entity per square
    let id = 0
    for (let i = 0; i < squareDimension; i++) {
      for (let j = 0; j < squareDimension; j++) {
        entities[id.toString()] = vec2.add(
          vec2.create(),
          vec2.fromValues(
            j * TILE_SIZE + TILE_SIZE * 0.5,
            i * TILE_SIZE + TILE_SIZE * 0.5,
          ),
          origin,
        )
        qt.insert({ id: id.toString() })
        id++
      }
    }

    // Look up tests

    // [0,0] => [3, 1]
    const res1 = qt.query([
      origin,
      vec2.add(
        vec2.create(),
        origin,
        vec2.fromValues(TILE_SIZE * 3, TILE_SIZE),
      ),
    ])
    expect(res1).toEqual([{ id: '0' }, { id: '1' }, { id: '2' }])

    // [1,1] => [4, 4]
    const res2 = qt.query([
      vec2.add(vec2.create(), origin, vec2.fromValues(TILE_SIZE, TILE_SIZE)),
      vec2.add(
        vec2.create(),
        origin,
        vec2.fromValues(TILE_SIZE * 4, TILE_SIZE * 4),
      ),
    ])
    expect(res2).toEqual(
      expect.arrayContaining([
        { id: '17' },
        { id: '18' },
        { id: '19' },
        { id: '33' },
        { id: '34' },
        { id: '35' },
        { id: '49' },
        { id: '50' },
        { id: '51' },
      ]),
    )
  })
})
