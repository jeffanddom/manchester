import { PriorityQueue } from '~/util/PriorityQueue'

const stepRange: [-1, 0, 1] = [-1, 0, 1]

type SearchPoint = {
  x: number
  y: number
  dirX: number
  dirY: number
  forcedNeighbor?: boolean
}
type JumpPoint = SearchPoint & {
  distance: number
  previous: string
}

function pointId(point: SearchPoint): string {
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

  let finalNode: JumpPoint | undefined = undefined

  // Initial setup
  jumpPoints.set(`${sx},${sy}`, {
    x: sx,
    y: sy,
    dirX: 0,
    dirY: 0,
    distance: 0,
    previous: '',
  })
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
        previous: '',
      })
    }
  }

  // Search from open nodes
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

    for (const point of checkSet) {
      const jumpPoint = findJump(
        point,
        current.dirX,
        current.dirY,
        dx,
        dy,
        grid,
        w,
      )
      if (jumpPoint !== null) {
        const distance = Math.sqrt(
          Math.pow(jumpPoint.x - sx, 2) + Math.pow(jumpPoint.y - sy, 2),
        )
        const toAdd: JumpPoint = {
          ...jumpPoint,
          distance: distance,
          previous: pointId(current),
        }

        openList.push(toAdd)
        jumpPoints.set(pointId(toAdd), toAdd)
        if (toAdd.x === dx && toAdd.y === dy) {
          finalNode = toAdd
        }
      }
    }
  }

  const path = []
  let nextNode = finalNode
  while (nextNode !== undefined) {
    console.log(nextNode)
    path.unshift(nextNode.x, nextNode.y)
    nextNode = jumpPoints.get(nextNode.previous)
  }

  console.log(path)
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
  if (neighbors.find((p) => p.forcedNeighbor) !== undefined) {
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

/**
 * Returns a flattened array of (x, y, dirX, dirY, forced) tuples. `forced` is 1 if the
 * neighbor is a forced neighbor.
 */
export function getNeighbors(
  x: number,
  y: number,
  stepX: number,
  stepY: number,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  return stepX !== 0 && stepY !== 0
    ? getNeighborsDiagonal(x, y, stepX, stepY, grid, w)
    : getNeighborsCardinal(x, y, stepX, stepY, grid, w)
}

function getNeighborsDiagonal(
  x: number,
  y: number,
  stepX: number,
  stepY: number,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  const res: SearchPoint[] = []

  // Check unforced neighbors

  const p1 = (y + stepY) * w + (x + stepX)
  if (grid[p1] === 0) {
    res.push({
      x: x + stepX,
      y: y + stepY,
      dirX: stepX,
      dirY: stepY,
    })
  }

  const p2 = y * w + (x + stepX)
  if (grid[p2] === 0) {
    res.push({
      x: x + stepX,
      y: y,
      dirX: stepX,
      dirY: 0,
    })
  }

  const p3 = (y + stepY) * w + x
  if (grid[p3] === 0) {
    res.push({
      x: x,
      y: y + stepY,
      dirX: 0,
      dirY: stepY,
    })
  }

  // Check forced neighbors

  const p4 = y * w + (x - stepX)
  if (grid[p4] === 1) {
    const n = (y + stepY) * w + (x - stepX)
    if (grid[n] === 0) {
      res.push({
        x: x - stepX,
        y: y + stepY,
        dirX: -stepX,
        dirY: stepY,
        forcedNeighbor: true,
      })
    }
  }

  const p5 = (y - stepY) * w + x
  if (grid[p5] === 1) {
    const n = (y - stepY) * w + (x + stepX)
    if (grid[n] === 0) {
      res.push({
        x: x + stepX,
        y: y - stepY,
        dirX: stepX,
        dirY: -stepY,
        forcedNeighbor: true,
      })
    }
  }

  return res
}

function getNeighborsCardinal(
  x: number,
  y: number,
  stepX: number,
  stepY: number,
  grid: Uint8Array,
  w: number,
): SearchPoint[] {
  const res: SearchPoint[] = []

  // Check unforced neighbors
  const p = (y + stepY) * w + (x + stepX)
  if (grid[p] === 0) {
    res.push({
      x: x + stepX,
      y: y + stepY,
      dirX: stepX,
      dirY: stepY,
    })
  }

  // Forced neighbor check
  if (stepY === 0) {
    // horizontal
    const p1 = (y + 1) * w + x
    if (grid[p1] === 1) {
      const n = (y + 1) * w + (x + stepX)
      if (grid[n] === 0) {
        res.push({
          x: x + stepX,
          y: y + 1,
          dirX: stepX,
          dirY: 1,
          forcedNeighbor: true,
        })
      }
    }

    const p2 = (y - 1) * w + x
    if (grid[p2] === 1) {
      const n = (y - 1) * w + (x + stepX)
      if (grid[n] === 0) {
        res.push({
          x: x + stepX,
          y: y - 1,
          dirX: stepX,
          dirY: -1,
          forcedNeighbor: true,
        })
      }
    }
  } else {
    // vertical
    const p1 = y * w + (x + 1)
    if (grid[p1] === 1) {
      const n = (y + stepY) * w + (x + 1)
      if (grid[n] === 0) {
        res.push({
          x: x + 1,
          y: y + stepY,
          dirX: 1,
          dirY: stepY,
          forcedNeighbor: true,
        })
      }
    }

    const p2 = y * w + (x - 1)
    if (grid[p2] === 1) {
      const n = (y + stepY) * w + (x - 1)
      if (grid[n] === 0) {
        res.push({
          x: x - 1,
          y: y + stepY,
          dirX: -1,
          dirY: stepY,
          forcedNeighbor: true,
        })
      }
    }
  }

  return res
}
