// export function jps(
//   sx: number,
//   sy: number,
//   dx: number,
//   dy: number,
//   grid: Uint8Array,
//   w: number,
// ): number[] {}
//
//
/*
while openList has stuff:
  current = openList.getHighestPri()
  for -1..1 as stepX:
    for -1..1 as stepY:
      next if stepX is 0 and stepY is 0
      foreach findJump(current.x, current.y, stepX, stepY, grid, w) as jumpPoint:
        openList.push(jumpPoint)

findJump(
  x: number,
  y: number,
  stepX: -1 | 0 | 1,
  stepY: -1 | 0 | 1,
  grid: Uint8Array,
  w: number
):
  nextNode = x,y + stepX,stepY

  if (nextNode is wall or out of bounds)
    return null

  if (nextNode is goal)
    return nextNode

  if hasForcedNeighbors(getNeighbors(nextNode, stepX, stepY, grid, w)):
    return nextNode    
  
  if diagonal:
    a = findJump(nextNode.x, nextNode.y, 0, stepY, grid, w) if the thing is not null
    b = findJump(nextNode.x, nextNode.y, stepX, 0, grid, w) if the thing is not null
    if a && b
      return [a, b]
    else if a
      return [a]
    else if b
      return [b]

  return findJump(nextNode.x, nextNode.y, stepX, stepY, grid, w)
*/

/**
 * Returns a flattened array of (x, y, forced) tuples. `forced` is 1 if the
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
