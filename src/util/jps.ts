import { PriorityQueue } from '~/util/PriorityQueue'

type SearchPoint = PointWithDir & {
  previous: string | undefined
  sortDistance: number // includes A* heuristic
  pathLength: number // sum of pathLengths of ancestor points
}

type PointWithDir = {
  x: number
  y: number
  dirX: number
  dirY: number
}

function pointId(point: PointWithDir): string {
  return `${point.x},${point.y},${point.dirX},${point.dirY}`
}

function euclideanDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const a = x1 - x2
  const b = y1 - y2
  return Math.sqrt(a * a + b * b)
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
): number[] | undefined {
  const pathNodes = new Map<string, SearchPoint>()
  const openList = new PriorityQueue<SearchPoint>(
    (a, b) => a.sortDistance! - b.sortDistance!,
  )

  // Initial setup
  const start: SearchPoint = {
    x: sx,
    y: sy,
    dirX: 0,
    dirY: 0,
    sortDistance: 0 + euclideanDistance(sx, sy, dx, dy),
    pathLength: 0,
    previous: undefined,
  }
  pathNodes.set(pointId(start), start)
  openList.push(start)

  let destSearchPoint: SearchPoint | undefined

  // Search from open nodes
  while (openList.length() > 0) {
    const current = openList.pop()!

    if (current.x === dx && current.y === dy) {
      destSearchPoint = current
      break
    }

    const checkSet =
      current.previous === undefined
        ? getImmediateNeighbors(current, grid, w)
        : getNeighbors(current, grid, w)

    for (const point of checkSet) {
      const jumpPoint = findJump(point, dx, dy, grid, w)
      if (jumpPoint !== undefined) {
        const pathLength =
          current.pathLength +
          euclideanDistance(current.x, current.y, jumpPoint.x, jumpPoint.y)
        const sortDistance =
          pathLength + euclideanDistance(jumpPoint.x, jumpPoint.y, dx, dy)
        const toAdd: SearchPoint = {
          ...jumpPoint,
          previous: pointId(current),
          pathLength,
          sortDistance,
        }

        openList.push(toAdd)
        pathNodes.set(pointId(toAdd), toAdd)
      }
    }
  }

  if (destSearchPoint === undefined) {
    return undefined
  }

  const path = []
  let nextNode: SearchPoint | undefined = destSearchPoint
  while (nextNode !== undefined) {
    path.unshift(nextNode.x, nextNode.y)
    nextNode = pathNodes.get(nextNode.previous!)
  }

  return path
}

export function findJump(
  point: PointWithDir,
  dx: number,
  dy: number,
  grid: Uint8Array,
  w: number,
): PointWithDir | undefined {
  // Goal! Return the node
  if (point.x === dx && point.y === dy) {
    return point
  }

  // Node is a jump point, return the jump point
  if (hasForcedNeighbors(point, grid, w)) {
    return point
  }

  if (point.dirX !== 0 && point.dirY !== 0) {
    // go horizontal
    if (
      validPoint(point.x + point.dirX, point.y, grid, w) &&
      findJump(
        { ...point, x: point.x + point.dirX, dirY: 0 },
        dx,
        dy,
        grid,
        w,
      ) !== undefined
    ) {
      return point
    }

    // go vertical
    if (
      validPoint(point.x, point.y + point.dirY, grid, w) &&
      findJump(
        { ...point, y: point.y + point.dirY, dirX: 0 },
        dx,
        dy,
        grid,
        w,
      ) !== undefined
    ) {
      return point
    }
  }

  const nextX = point.x + point.dirX
  const nextY = point.y + point.dirY

  if (!validPoint(nextX, nextY, grid, w)) {
    return undefined
  }

  const nextPoint = {
    ...point,
    x: nextX,
    y: nextY,
  }

  // Check diagonals

  return findJump(nextPoint, dx, dy, grid, w)
}

export function hasForcedNeighbors(
  point: PointWithDir,
  grid: Uint8Array,
  w: number,
): boolean {
  const { x, y, dirX, dirY } = point

  // Diagonal motion
  if (point.dirX !== 0 && point.dirY !== 0) {
    if (
      validWall(x - dirX, y, grid, w) &&
      validPoint(x - dirX, y + dirY, grid, w)
    ) {
      return true
    }

    if (
      validWall(x, y - dirY, grid, w) &&
      validPoint(x + dirX, y - dirY, grid, w)
    ) {
      return true
    }

    return false
  }

  // Horizontal motion
  if (dirY === 0) {
    // horizontal
    const p1 = (y + 1) * w + x
    if (grid[p1] === 1) {
      const n = (y + 1) * w + (x + dirX)
      if (grid[n] === 0) {
        return true
      }
    }

    const p2 = (y - 1) * w + x
    if (grid[p2] === 1) {
      const n = (y - 1) * w + (x + dirX)
      if (grid[n] === 0) {
        return true
      }
    }

    return false
  }

  // Vertical motion
  const p1 = y * w + (x + 1)
  if (grid[p1] === 1) {
    const n = (y + dirY) * w + (x + 1)
    if (grid[n] === 0) {
      return true
    }
  }

  const p2 = y * w + (x - 1)
  if (grid[p2] === 1) {
    const n = (y + dirY) * w + (x - 1)
    if (grid[n] === 0) {
      return true
    }
  }

  return false
}

/**
 * Returns a flattened array of (x, y, dirX, dirY, forced) tuples. `forced` is 1 if the
 * neighbor is a forced neighbor.
 */
export function getNeighbors(
  point: PointWithDir,
  grid: Uint8Array,
  w: number,
): PointWithDir[] {
  return point.dirX !== 0 && point.dirY !== 0
    ? getNeighborsDiagonal(point, grid, w)
    : getNeighborsCardinal(point, grid, w)
}

const potentialSteps = [-1, 0, 1]
function getImmediateNeighbors(
  point: PointWithDir,
  grid: Uint8Array,
  w: number,
) {
  const res: PointWithDir[] = []

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
  point: PointWithDir,
  grid: Uint8Array,
  w: number,
): PointWithDir[] {
  const { x, y, dirX, dirY } = point
  const res: PointWithDir[] = []

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
      })
    }
  }

  return res
}

function getNeighborsCardinal(
  point: PointWithDir,
  grid: Uint8Array,
  w: number,
): PointWithDir[] {
  const { x, y, dirX, dirY } = point
  const res: PointWithDir[] = []

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
        })
      }
    }
  }

  return res
}
