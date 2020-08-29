import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { PriorityQueue } from '~/util/PriorityQueue'
import { tileCoords } from '~/util/tileMath'

interface Node {
  score: number
  distance: number
  prev?: [number, number]
}

const vecToPos = (v: vec2): string => {
  return `${v[0]}:${v[1]}`
}

const MAX_PATH_LENGTH = 100

export const pathfind = (
  g: Game,
  from: vec2,
  to: vec2,
): [vec2[] | null, string[]] => {
  // Generate fresh node mapping
  const nodes: { [key: string]: Node } = {}
  const walls = Object.values(g.server.entityManager.entities)
    .filter((other) => other.wall)
    .filter(
      (other) =>
        vec2.distance(from, other.transform!.position) <=
        MAX_PATH_LENGTH * TILE_SIZE,
    )
    .reduce((accum, entity) => {
      const tilePos = vecToPos(tileCoords(entity.transform!.position))
      accum[tilePos] = true
      return accum
    }, {} as { [key: string]: boolean })

  // Coordinates to check
  const toVisit = new PriorityQueue<[number, number]>((a, b) => {
    const nodeA = nodes[vecToPos(a)]
    const nodeB = nodes[vecToPos(b)]
    return nodeA.score + nodeA.distance - (nodeB.score + nodeB.distance)
  })

  // Set up starting node
  const startNode = { score: Number.MAX_VALUE, distance: Number.MAX_VALUE }
  startNode.distance = vec2.distance(from, to)
  startNode.score = 0
  toVisit.push([from[0], from[1]])
  nodes[vecToPos(from)] = startNode

  while (toVisit.length() > 0) {
    const checkCoord = toVisit.pop()

    // We ended up with undefined somehow
    // This shouldn't happen
    if (!checkCoord) {
      break
    }

    if (vec2.equals(checkCoord, to)) {
      // Success!
      const path = [vec2.fromValues(...checkCoord)]

      // Build path to destination
      let node = nodes[vecToPos(checkCoord)]
      while (node.prev && !vec2.equals(node.prev, from)) {
        path.push(vec2.fromValues(...node.prev))
        node = nodes[vecToPos(node.prev)]
      }

      // Convert map from tile coordinates to world coordinates
      return [
        path.reverse().map((t) => {
          const w = vec2.scale(vec2.create(), t, TILE_SIZE)
          vec2.add(w, w, vec2.fromValues(TILE_SIZE / 2, TILE_SIZE / 2))
          return w
        }),
        Object.keys(nodes),
      ]
    }

    // Get neighbors we haven't visited, and sort nodes to
    // search by distance from the target destination
    getNeighbors(nodes, walls, checkCoord, to).forEach((n) => toVisit.push(n))
  }

  return [null, Object.keys(nodes)]
}

// Add nodes with distances for NSEW iff they're not a wall
const getNeighbors = (
  nodes: { [key: string]: Node },
  walls: { [key: string]: boolean },
  coord: [number, number],
  to: vec2,
): [number, number][] => {
  const [x, y] = coord
  const neighborList: [number, number][] = []

  const cur = nodes[vecToPos(coord)]
  const neighbors: [number, number][] = [
    [0, -1], // North
    [0, +1], // South
    [-1, 0], // West
    [+1, 0], // East
    [-1, -1], // NW
    [+1, -1], // NE
    [-1, +1], // SW
    [+1, +1], // SE
  ]

  neighbors.forEach(([dx, dy]) => {
    let score = 1

    if (
      dx != 0 &&
      walls[vecToPos(vec2.add(vec2.create(), coord, vec2.fromValues(dx, 0)))]
    ) {
      return
    }
    if (
      dy != 0 &&
      walls[vecToPos(vec2.add(vec2.create(), coord, vec2.fromValues(0, dy)))]
    ) {
      return
    }
    if (dx != 0 && dy != 0) {
      // Diagonal movement
      score = Math.SQRT2
      if (
        walls[vecToPos(vec2.add(vec2.create(), coord, vec2.fromValues(dx, dy)))]
      ) {
        return
      }
    }

    const pos = vecToPos([x + dx, y + dy])

    let neighborNode = nodes[pos]
    if (neighborNode) {
      // Update score and previous node
      // if a better path is found
      if (neighborNode.score > cur.score + score) {
        neighborNode.prev = [x, y]
        neighborNode.score = cur.score + score // TODO: need to re-sort toVisit based on decreased priority
        nodes[pos] = neighborNode
      }
    } else {
      if (cur.score >= MAX_PATH_LENGTH) {
        return
      }

      // If we haven't seen this node before, record it on the
      // map, and add it to our potential search space
      neighborNode = {
        prev: [x, y],
        score: cur.score + score,
        distance: vec2.distance(vec2.fromValues(x + dx, y + dy), to),
      }
      nodes[pos] = neighborNode
      neighborList.push([x + dx, y + dy])
    }
  })

  return neighborList
}
