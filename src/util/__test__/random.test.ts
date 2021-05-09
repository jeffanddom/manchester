import { sample, shuffle } from '../random'

describe('shuffle', () => {
  it('basic test', () => {
    const a = [0]
    for (let i = 0; i < 100; i++) {
      expect(shuffle(a)).toEqual(a)
    }

    const b = [0, 1, 2, 3, 4, 5]
    const outOfPosition = new Set<number>()
    testb: for (let i = 0; i < 100; i++) {
      const shuffled = shuffle(b)
      for (let j = 0; j < shuffled.length; j++) {
        if (j !== shuffled[j]) {
          outOfPosition.add(j)
          if (outOfPosition.size === b.length) {
            break testb
          }
        }
      }
    }
    expect(outOfPosition.size).toBe(b.length)
  })
})

describe('sample', () => {
  it('basic test', () => {
    const a = [0]
    for (let i = 0; i < 100; i++) {
      expect(sample(a)).toBe(0)
    }

    const b = [0, 1, 2, 3, 4, 5]
    const sampled = new Set<number>()
    for (let i = 0; i < 100; i++) {
      const v = sample(b)
      expect(v).toBeDefined()
      sampled.add(v)
      if (sampled.size === b.length) {
        break
      }
    }
    expect(sampled.size).toBe(b.length)
  })
})
