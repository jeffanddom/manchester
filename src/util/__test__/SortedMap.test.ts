import { SortedMap } from '../SortedMap'

describe('SortedMap', () => {
  it('basic adds/removes', () => {
    const m = new SortedMap<string, number>()

    expect(m.size()).toBe(0)

    expect(m.has('a')).toBe(false)
    m.set('a', 1)
    expect(m.has('a')).toBe(true)

    m.set('b', 2)
    expect(m.size()).toBe(2)

    expect(m.get('a')).toBe(1)
    expect(m.get('b')).toBe(2)
    expect(m.get('c')).toBeUndefined()

    expect(m.delete('a')).toBe(true)
    expect(m.has('a')).toBe(false)
    expect(m.size()).toBe(1)

    expect(m.get('a')).toBeUndefined()
    expect(m.get('b')).toBe(2)
    expect(m.get('c')).toBeUndefined()

    expect(m.delete('b')).toBe(true)
    expect(m.size()).toBe(0)

    expect(m.get('a')).toBeUndefined()
    expect(m.get('b')).toBeUndefined()
    expect(m.get('c')).toBeUndefined()

    expect(m.delete('zzzz')).toBe(false)
    expect(m.size()).toBe(0)
  })

  it('iteration order', () => {
    const cases: [[string, number][], [string, number][]][] = [
      // empty
      [[], []],
      // one entry
      [[['a', 1]], [['a', 1]]],
      // multiple objects in order
      [
        [
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ],
        [
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ],
      ],
      // slightly out of order
      [
        [
          ['a', 1],
          ['b', 2],
          ['d', 4],
          ['c', 3],
        ],
        [
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ],
      ],
      // fully reversed order
      [
        [
          ['d', 4],
          ['c', 3],
          ['b', 2],
          ['a', 1],
        ],
        [
          ['a', 1],
          ['b', 2],
          ['c', 3],
          ['d', 4],
        ],
      ],
    ]

    for (const [insert, want] of cases) {
      const m = new SortedMap<string, number>()
      for (const [k, v] of insert) {
        m.set(k, v)
      }

      const got = []
      for (const res of m) {
        got.push(res)
      }

      expect(got).toStrictEqual(want)
    }
  })
})
