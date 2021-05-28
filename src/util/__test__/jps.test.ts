import { getNeighbors, jps } from '../jps'

describe('jps', () => {
  describe('full search', () => {
    it('finds a path with no obstacles', () => {
      // prettier-ignore
      const grid = new Uint8Array([
        0, 0, 0,
        0, 0, 0,
        0, 0, 0
      ])

      const path = jps(0, 0, 2, 2, grid, 3)
      expect(path).toEqual([0, 0, 2, 2])
    })

    it('finds a path with one obstacles', () => {
      // prettier-ignore
      const grid = new Uint8Array([
        0, 0, 0,
        0, 1, 0,
        0, 0, 0
      ])

      const path = jps(0, 0, 2, 2, grid, 3)
      expect(path).toEqual([0, 0, 0, 1, 1, 2, 2, 2])
    })

    it('finds a path in a larger map', () => {
      // prettier-ignore
      const grid = new Uint8Array([
        0, 0, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 0, 0
      ])

      const path = jps(0, 2, 4, 2, grid, 5)
      expect(path).toEqual([0, 2, 2, 0, 4, 2])
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

      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: 0 }, grid, 3)).toEqual(
        [{ x: 2, y: 1, dirX: 1, dirY: 0 }])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: -1, dirY: 0 }, grid, 3)).toEqual(
        [{ x: 0, y: 1, dirX: -1, dirY: 0 }])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: 0, dirY: 1 }, grid, 3)).toEqual(
        [{ x: 1, y: 2, dirX: 0, dirY: 1 }])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: 0, dirY: -1 }, grid, 3)).toEqual(
        [{ x: 1, y: 0, dirX: 0, dirY: -1 }])

      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: 1 }, grid, 3)).toEqual([
        { x: 2, y: 2, dirX: 1, dirY: 1 },
        { x: 2, y: 1, dirX: 1, dirY: 0 },
        { x: 1, y: 2, dirX: 0, dirY: 1 },
      ])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: -1, dirY: -1 }, grid, 3)).toEqual([
        { x: 0, y: 0, dirX: -1, dirY: -1 },
        { x: 0, y: 1, dirX: -1, dirY: 0 },
        { x: 1, y: 0, dirX: 0, dirY: -1 },
      ])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: -1, dirY: 1 }, grid, 3)).toEqual([
        { x: 0, y: 2, dirX: -1, dirY: 1 },
        { x: 0, y: 1, dirX: -1, dirY: 0 },
        { x: 1, y: 2, dirX: 0, dirY: 1 },
      ])
      // prettier-ignore
      expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: -1 }, grid, 3)).toEqual([
        { x: 2, y: 0, dirX: 1, dirY: -1 },
        { x: 2, y: 1, dirX: 1, dirY: 0 },
        { x: 1, y: 0, dirX: 0, dirY: -1 },
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

        // prettier-ignore
        expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: 0 }, grid, 3)).toEqual(
          [{ x: 2, y: 1, dirX: 1, dirY: 0 }])
        expect(
          getNeighbors({ x: 1, y: 1, dirX: -1, dirY: 0 }, grid, 3),
        ).toEqual([])
        // prettier-ignore
        expect(getNeighbors({ x: 1, y: 1, dirX: 0, dirY: 1 }, grid, 3)).toEqual([
          { x: 1, y: 2, dirX: 0, dirY: 1 },
          { x: 0, y: 2, dirX: -1, dirY: 1, forcedNeighbor: true }
        ])
        // prettier-ignore
        expect(getNeighbors({ x: 1, y: 1, dirX: 0, dirY: -1 }, grid, 3)).toEqual([
          { x: 1, y: 0, dirX: 0, dirY: -1 },
          { x: 0, y: 0, dirX: -1, dirY: -1, forcedNeighbor: true }
        ])

        // prettier-ignore
        expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: -1 }, grid, 3)).toEqual([
          { x: 2, y: 0, dirX: 1, dirY: -1 },
          { x: 2, y: 1, dirX: 1, dirY: 0 },
          { x: 1, y: 0, dirX: 0, dirY: -1 },
          { x: 0, y: 0, dirX: -1, dirY: -1, forcedNeighbor: true },
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
        expect(getNeighbors({ x: 1, y: 1, dirX: 1, dirY: -1 }, grid, 3)).toEqual([
          { x: 2, y: 0, dirX: 1, dirY: -1 },
          { x: 2, y: 1, dirX: 1, dirY: 0 },
          { x: 1, y: 0, dirX: 0, dirY: -1 },
          { x: 0, y: 0, dirX: -1, dirY: -1, forcedNeighbor: true },
          { x: 2, y: 2, dirX: 1, dirY: 1, forcedNeighbor: true },
        ])
      })
    })
  })
})
