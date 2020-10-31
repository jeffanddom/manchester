import { SortedSet } from './SortedSet'

describe('SortedSet', () => {
  it('basic adds/removes', () => {
    const m = new SortedSet<string>()

    expect(m.size()).toBe(0)

    expect(m.has('a')).toBe(false)
    m.add('a')
    expect(m.has('a')).toBe(true)
    expect(m.size()).toBe(1)

    expect(m.has('b')).toBe(false)
    m.add('b')
    expect(m.has('a')).toBe(true)
    expect(m.size()).toBe(2)

    expect(m.has('c')).toBe(false)

    expect(m.delete('a')).toBe(true)
    expect(m.has('a')).toBe(false)
    expect(m.size()).toBe(1)

    expect(m.delete('b')).toBe(true)
    expect(m.has('b')).toBe(false)
    expect(m.size()).toBe(0)

    expect(m.delete('zzzz')).toBe(false)
    expect(m.size()).toBe(0)
  })

  it('iteration order', () => {
    const cases: [string[], string[]][] = [
      // empty
      [[], []],
      // one entry
      [['a'], ['a']],
      // multiple objects in order
      [
        ['a', 'b', 'c', 'd'],
        ['a', 'b', 'c', 'd'],
      ],
      // slightly out of order
      [
        ['a', 'b', 'd', 'c'],
        ['a', 'b', 'c', 'd'],
      ],
      // fully reversed order
      [
        ['d', 'c', 'b', 'a'],
        ['a', 'b', 'c', 'd'],
      ],
    ]

    for (const [insert, want] of cases) {
      const m = new SortedSet<string>()
      for (const k of insert) {
        m.add(k)
      }

      const got = []
      for (const res of m) {
        got.push(res)
      }

      expect(got).toStrictEqual(want)
    }
  })
})
