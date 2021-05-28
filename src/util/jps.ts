import { PriorityQueue } from '~/util/PriorityQueue'

const stepRange: [-1, 0, 1] = [-1, 0, 1]
const NEIGHBOR_ARRAY_SPLIT = 5

type JumpPoint = {
  x: number
  y: number
  dirX: -1 | 0 | 1
  dirY: -1 | 0 | 1
  distance: number
  previous?: string
}

function jumpPointId(point: JumpPoint): string {
  return `${point.x},${point.y}`
}

export function jps(
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  grid: Uint8Array,
  w: number,
): number[] {
  const jumpPoints = new Map<string, JumpPoint>()
  const openList = new PriorityQueue<JumpPoint>(
    (a, b) => a.distance - b.distance,
  )

  for (const stepX of stepRange) {
    for (const stepY of stepRange) {
      if (stepX === 0 && stepY === 0) {
        continue
      }
      openList.push({
        x: sx,
        y: sy,
        dirX: stepX,
        dirY: stepY,
        distance: 0,
      })
    }
  }

  while (openList.length() > 0) {
    const current = openList.pop()
    if (current === undefined) {
      return []
    }

    const checkSet = getNeighbors(
      current.x,
      current.y,
      current.dirX,
      current.dirY,
      grid,
      w,
    )

    for (let i = 0; i < checkSet.length / NEIGHBOR_ARRAY_SPLIT; i++) {
      const jumpPoint = findJump(current, stepX, stepY, dx, dy, grid, w)
      if (jumpPoint !== null) {
        const distance = Math.sqrt(
          Math.pow(jumpPoint.x - sx, 2) + Math.pow(jumpPoint.y - sy, 2),
        )
        jumpPoint.distance = distance
        jumpPoint.previous = jumpPointId(current)

        openList.push(jumpPoint)
        jumpPoints.set(jumpPointId(jumpPoint), jumpPoint)
      }
    }
  }

  console.log(jumpPoints)
  return []
}

export function findJump(
  point: JumpPoint,
  stepX: -1 | 0 | 1,
  stepY: -1 | 0 | 1,
  dx: number,
  dy: number,
  grid: Uint8Array,
  w: number,
): JumpPoint | null {
  const nextX = point.x + stepX
  const nextY = point.y + stepY

  if (
    grid[nextX + nextY * w] === 1 || // Wall - return nothin'
    nextX < 0 || // Outside the grid
    w <= nextX ||
    nextY < 0 ||
    w <= nextY
  ) {
    return null
  }

  const nextPoint = {
    x: nextX,
    y: nextY,
    dirX: stepX,
    dirY: stepY,
    distance: -1,
  }

  // Goal! Return the node
  if (nextX === dx && nextY === dy) {
    return nextPoint
  }

  // Node is a jump point, return the jump point
  const neighbors = getNeighbors(nextX, nextY, stepX, stepY, grid, w)
  if (hasForcedNeighbors(neighbors)) {
    return nextPoint
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

function hasForcedNeighbors(neighborList: number[]): boolean {
  for (let i = 0; i < neighborList.length / NEIGHBOR_ARRAY_SPLIT; i++) {
    if (neighborList[i + 4] === 1) {
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
  x: number,
  y: number,
  stepX: -1 | 0 | 1,
  stepY: -1 | 0 | 1,
  grid: Uint8Array,
  w: number,
): number[] {
  return stepX !== 0 && stepY !== 0
    ? getNeighborsDiagonal(x, y, stepX, stepY, grid, w)
    : getNeighborsCardinal(x, y, stepX, stepY, grid, w)
}

function getNeighborsDiagonal(
  x: number,
  y: number,
  stepX: -1 | 0 | 1,
  stepY: -1 | 0 | 1,
  grid: Uint8Array,
  w: number,
): number[] {
  const res: number[] = []

  // Check unforced neighbors

  const p1 = (y + stepY) * w + (x + stepX)
  if (grid[p1] === 0) {
    res.push(x + stepX, y + stepY, 0)
  }

  const p2 = y * w + (x + stepX)
  if (grid[p2] === 0) {
    res.push(x + stepX, y, 0)
  }

  const p3 = (y + stepY) * w + x
  if (grid[p3] === 0) {
    res.push(x, y + stepY, 0)
  }

  // Check forced neighbors

  const p4 = y * w + (x - stepX)
  if (grid[p4] === 1) {
    const n = (y + stepY) * w + (x - stepX)
    if (grid[n] === 0) {
      res.push(x - stepX, y + stepY, 1)
    }
  }

  const p5 = (y - stepY) * w + x
  if (grid[p5] === 1) {
    const n = (y - stepY) * w + (x + stepX)
    if (grid[n] === 0) {
      res.push(x + stepX, y - stepY, 1)
    }
  }

  return res
}

function getNeighborsCardinal(
  x: number,
  y: number,
  stepX: -1 | 0 | 1,
  stepY: -1 | 0 | 1,
  grid: Uint8Array,
  w: number,
): number[] {
  const res: number[] = []

  // Check unforced neighbors
  const p = (y + stepY) * w + (x + stepX)
  if (grid[p] === 0) {
    res.push(x + stepX, y + stepY, 0)
  }

  // Forced neighbor check
  if (stepY === 0) {
    // horizontal
    const p1 = (y + 1) * w + x
    if (grid[p1] === 1) {
      const n = (y + 1) * w + (x + stepX)
      if (grid[n] === 0) {
        res.push(x + stepX, y + 1, 1)
      }
    }

    const p2 = (y - 1) * w + x
    if (grid[p2] === 1) {
      const n = (y - 1) * w + (x + stepX)
      if (grid[n] === 0) {
        res.push(x + stepX, y - 1, 1)
      }
    }
  } else {
    // vertical
    const p1 = y * w + (x + 1)
    if (grid[p1] === 1) {
      const n = (y + stepY) * w + (x + 1)
      if (grid[n] === 0) {
        res.push(x + 1, y + stepY, 1)
      }
    }

    const p2 = y * w + (x - 1)
    if (grid[p2] === 1) {
      const n = (y + stepY) * w + (x - 1)
      if (grid[n] === 0) {
        res.push(x - 1, y + stepY, 1)
      }
    }
  }

  return res
}
