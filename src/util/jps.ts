import { PriorityQueue } from '~/util/PriorityQueue'

type SearchPoint = {
  x: number
  y: number
  dirX: number
  dirY: number
  forcedNeighbor?: boolean
  previous?: string
  distance?: number
}

function pointId(point: SearchPoint): string {
  return `${point.x},${point.y}`
}

function chebyshev(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))
}

function inBounds(x: number, y: number, grid: Uint8Array, w: number): boolean {
  return 0 <= x && x < w && 0 <= y && y < grid.length / w
}

function validWall(x: number, y: number, grid: Uint8Array, w: number): boolean {
  return inBounds(x, y, grid, w) && grid[y * w + x] === 1
}

function validPoint(
  x: number,
  y: number,
  grid: Uint8Array,
  w: number,
): boolean {
  return inBounds(x, y, grid, w) && grid[y * w + x] !== 1
}

// TODO:
// - distance should account for path length walked + distance to destination
// - chebyshev replaced with euclidian
// - prevent walking through diagonal "gaps"
// - what happens if you push the same node twice onto the open list?
//     if different directions, allow it.
//     if not, ??? (that seems technically impossible)

export function jps(
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  grid: Uint8Array,
  w: number,
): number[] {
  const pathNodes = new Map<string, SearchPoint>()
  const openList = new PriorityQueue<SearchPoint>(
    (a, b) => a.distance! - b.distance!,
  )

  // Initial setup
  const start = {
    x: sx,
    y: sy,
    dirX: 0,
    dirY: 0,
    distance: chebyshev(sx, sy, dx, dy),
  }
  pathNodes.set(pointId(start), start)
  openList.push(start)

  // Search from open nodes
  while (openList.length() > 0) {
    const current = openList.pop()
    if (current === undefined) {
      return []
    }

    if (current.x === dx && current.y === dy) {
      break
    }

    const checkSet =
      current.previous === undefined
        ? getImmediateNeighbors(current, grid, w)
        : getNeighbors(current, grid, w)

    for (const point of checkSet) {
      const jumpPoint = findJump(point, point.dirX, point.dirY, dx, dy, grid, w)
      if (jumpPoint !== null) {
        const distance = chebyshev(jumpPoint.x, jumpPoint.y, dx, dy)

        const toAdd: SearchPoint = {
          ...jumpPoint,
          distance: distance,
          previous: pointId(current),
        }

        openList.push(toAdd)
        pathNodes.set(pointId(toAdd), toAdd)
      }
    }
  }

  const path = []
  let nextNode = pathNodes.get(`${dx},${dy}`)
  while (nextNode !== undefined) {
    path.unshift(nextNode.x, nextNode.y)
    nextNode = pathNodes.get(nextNode.previous!)
  }

  return path
}

export function findJump(
  point: SearchPoint,
  stepX: number,
  stepY: number,
  dx: number,
  dy: number,
  grid: Uint8Array,
  w: number,
): SearchPoint | null {
  // Goal! Return the node
  if (point.x === dx && point.y === dy) {
    return point
  }

  // Node is a jump point, return the jump point
  const neighbors = getNeighbors(point, grid, w)
  if (neighbors.find((p) => p.forcedNeighbor) !== undefined) {
    return point
  }

  const nextX = point.x + stepX
  const nextY = point.y + stepY

  if (!validPoint(nextX, nextY, grid, w)) {
    return null
  }

  const nextPoint = {
    x: nextX,
    y: nextY,
    dirX: stepX,
    dirY: stepY,
    distance: chebyshev(nextX, nextY, dx, dy),
  }

  // Check diagonals
  if (stepX !== 0 && stepY !== 0) {
    const diagonal1 = findJump(nextPoint, stepX, 0, dx, dy, grid, w)
    if (diagonal1 !== null) {
      return diagonal1
    }
    const diagonal2 = findJump(nextPoint, 0, stepY, dx, dy, grid, w)
    if (diagonal2 !== null) {
      return diagonal2
    }
  }

  return findJump(nextPoint, stepX, stepY, dx, dy, grid, w)
}

/**
 * Returns a flattened array of (x, y, dirX, dirY, forced) tuples. `forced` is 1 if the
 * neighbor is a forced neighbor.
 */
export function getNeighbors(
  point: SearchPoint,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  return point.dirX !== 0 && point.dirY !== 0
    ? getNeighborsDiagonal(point, grid, w)
    : getNeighborsCardinal(point, grid, w)
}

const potentialSteps = [-1, 0, 1]
function getImmediateNeighbors(
  point: SearchPoint,
  grid: Uint8Array,
  w: number,
) {
  const res: SearchPoint[] = []

  for (const stepX of potentialSteps) {
    for (const stepY of potentialSteps) {
      if (stepX === 0 && stepY === 0) {
        continue
      }

      const newX = point.x + stepX
      const newY = point.y + stepY
      if (!validPoint(newX, newY, grid, w)) {
        continue
      }

      res.push({
        x: newX,
        y: newY,
        dirX: stepX,
        dirY: stepY,
      })
    }
  }

  return res
}

function getNeighborsDiagonal(
  point: SearchPoint,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  const { x, y, dirX, dirY } = point
  const res: SearchPoint[] = []

  // Check unforced neighbors

  if (validPoint(x + dirX, y + dirY, grid, w)) {
    res.push({
      x: x + dirX,
      y: y + dirY,
      dirX: dirX,
      dirY: dirY,
    })
  }

  if (validPoint(x + dirX, y, grid, w)) {
    res.push({
      x: x + dirX,
      y: y,
      dirX: dirX,
      dirY: 0,
    })
  }

  if (validPoint(x, y + dirY, grid, w)) {
    res.push({
      x: x,
      y: y + dirY,
      dirX: 0,
      dirY: dirY,
    })
  }

  // Check forced neighbors

  if (validWall(x - dirX, y, grid, w)) {
    if (validPoint(x - dirX, y + dirY, grid, w)) {
      res.push({
        x: x - dirX,
        y: y + dirY,
        dirX: -dirX,
        dirY: dirY,
        forcedNeighbor: true,
      })
    }
  }

  if (validWall(x, y - dirY, grid, w)) {
    if (validPoint(x + dirX, y - dirY, grid, w)) {
      res.push({
        x: x + dirX,
        y: y - dirY,
        dirX: dirX,
        dirY: -dirY,
        forcedNeighbor: true,
      })
    }
  }

  return res
}

function getNeighborsCardinal(
  point: SearchPoint,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  const { x, y, dirX, dirY } = point
  const res: SearchPoint[] = []

  // Check unforced neighbors
  const p = (y + dirY) * w + (x + dirX)
  if (grid[p] === 0) {
    res.push({
      x: x + dirX,
      y: y + dirY,
      dirX: dirX,
      dirY: dirY,
    })
  }

  // Forced neighbor check
  if (dirY === 0) {
    // horizontal
    const p1 = (y + 1) * w + x
    if (grid[p1] === 1) {
      const n = (y + 1) * w + (x + dirX)
      if (grid[n] === 0) {
        res.push({
          x: x + dirX,
          y: y + 1,
          dirX: dirX,
          dirY: 1,
          forcedNeighbor: true,
        })
      }
    }

    const p2 = (y - 1) * w + x
    if (grid[p2] === 1) {
      const n = (y - 1) * w + (x + dirX)
      if (grid[n] === 0) {
        res.push({
          x: x + dirX,
          y: y - 1,
          dirX: dirX,
          dirY: -1,
          forcedNeighbor: true,
        })
      }
    }
  } else {
    // vertical
    const p1 = y * w + (x + 1)
    if (grid[p1] === 1) {
      const n = (y + dirY) * w + (x + 1)
      if (grid[n] === 0) {
        res.push({
          x: x + 1,
          y: y + dirY,
          dirX: 1,
          dirY: dirY,
          forcedNeighbor: true,
        })
      }
    }

    const p2 = y * w + (x - 1)
    if (grid[p2] === 1) {
      const n = (y + dirY) * w + (x - 1)
      if (grid[n] === 0) {
        res.push({
          x: x - 1,
          y: y + dirY,
          dirX: -1,
          dirY: dirY,
          forcedNeighbor: true,
        })
      }
    }
  }

  return res
}
