import { getNeighbors, jps } from '../jps'

describe('jps', () => {
  describe('full search', () => {
    it.only('finds a path', () => {
      // prettier-ignore
      const grid = new Uint8Array([
        0, 0, 0,
        0, 0, 0,
        0, 0, 0
      ])

      const path = jps(0, 0, 2, 2, grid, 3)
      expect(path).toEqual([0, 0, 2, 2])
    })
  })

  // describe('findJump', () => { })

  describe('getNeighbors', () => {
    it('no forced neighbors', () => {
      // prettier-ignore
      const grid = new Uint8Array([
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
      ])

      expect(getNeighbors(1, 1, 1, 0, grid, 3)).toEqual([2, 1, 0])
      expect(getNeighbors(1, 1, -1, 0, grid, 3)).toEqual([0, 1, 0])
      expect(getNeighbors(1, 1, 0, 1, grid, 3)).toEqual([1, 2, 0])
      expect(getNeighbors(1, 1, 0, -1, grid, 3)).toEqual([1, 0, 0])

      // prettier-ignore
      expect(getNeighbors(1, 1, 1, 1, grid, 3)).toEqual([
        2, 2, 0,
        2, 1, 0,
        1, 2, 0,
      ])
      // prettier-ignore
      expect(getNeighbors(1, 1, -1, -1, grid, 3)).toEqual([
        0, 0, 0,
        0, 1, 0,
        1, 0, 0,
      ])
      // prettier-ignore
      expect(getNeighbors(1, 1, -1, 1, grid, 3)).toEqual([
        0, 2, 0,
        0, 1, 0,
        1, 2, 0,
      ])
      // prettier-ignore
      expect(getNeighbors(1, 1, 1, -1, grid, 3)).toEqual([
        2, 0, 0,
        2, 1, 0,
        1, 0, 0,
      ])
    })

    describe('with forced neighbors', () => {
      it('a', () => {
        // prettier-ignore
        const grid = new Uint8Array([
          0, 0, 0,
          1, 0, 0,
          0, 0, 0,
        ])

        expect(getNeighbors(1, 1, 1, 0, grid, 3)).toEqual([2, 1, 0])
        expect(getNeighbors(1, 1, -1, 0, grid, 3)).toEqual([])
        // prettier-ignore
        expect(getNeighbors(1, 1, 0, 1, grid, 3)).toEqual([
          1, 2, 0,
          0, 2, 1
        ])
        // prettier-ignore
        expect(getNeighbors(1, 1, 0, -1, grid, 3)).toEqual([
          1, 0, 0,
          0, 0, 1
        ])

        // prettier-ignore
        expect(getNeighbors(1, 1, 1, -1, grid, 3)).toEqual([
          2, 0, 0,
          2, 1, 0,
          1, 0, 0,
          0, 0, 1,
        ])
      })

      it('b', () => {
        // prettier-ignore
        const grid = new Uint8Array([
          0, 0, 0,
          1, 0, 0,
          0, 1, 0,
        ])

        // prettier-ignore
        expect(getNeighbors(1, 1, 1, -1, grid, 3)).toEqual([
          2, 0, 0,
          2, 1, 0,
          1, 0, 0,
          0, 0, 1,
          2, 2, 1,
        ])
      })
    })
  })
})
