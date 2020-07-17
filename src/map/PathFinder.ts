import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Type } from '~/entities/types'
import { Map } from '~/map/interfaces'

interface Node {
  score: number
  distance: number
  prev?: [number, number]
}

const vecToPos = (v: vec2): string => {
  return `${v[0]}:${v[1]}`
}

export class PathFinder {
  map: Map
  nodes: { [key: string]: Node }

  constructor(map: Map) {
    this.map = map
    this.nodes = {}
  }

  discover(from: vec2, to: vec2): vec2[] {
    // Generate fresh node mapping
    this.nodes = {}

    // Coordinates to check
    let toVisit: [number, number][] = []

    // Set up starting node
    const startNode = { score: Number.MAX_VALUE, distance: Number.MAX_VALUE }
    startNode.distance = vec2.distance(from, to)
    startNode.score = 0
    toVisit.push([from[0], from[1]])
    this.nodes[vecToPos(from)] = startNode

    while (toVisit.length > 0) {
      const checkCoord = toVisit.shift()

      // We ended up with undefined somehow
      // This shouldn't happen
      if (!checkCoord) {
        break
      }

      if (vec2.equals(checkCoord, to)) {
        // Success!
        const path = [vec2.fromValues(...checkCoord)]

        // Build path to destination
        let node = this.nodes[vecToPos(checkCoord)]
        while (node.prev && !vec2.equals(node.prev, from)) {
          path.push(vec2.fromValues(...node.prev))
          node = this.nodes[vecToPos(node.prev)]
        }

        // Convert map from tile coordinates to world coordinates
        return path.reverse().map((t) => {
          const w = vec2.scale(vec2.create(), t, TILE_SIZE)
          vec2.add(w, w, vec2.fromValues(TILE_SIZE / 2, TILE_SIZE / 2))
          return w
        })
      }

      // Get neighbors we haven't visited, and sort nodes to
      // search by distance from the target destination
      toVisit = toVisit
        .concat(this.getNeighbors(checkCoord, to))
        .sort((a, b) => {
          const nodeA = this.nodes[vecToPos(a)]
          const nodeB = this.nodes[vecToPos(b)]
          return nodeA.score + nodeA.distance - (nodeB.score + nodeB.distance)
        })
    }

    return []
  }

  // Add nodes with distances for NSEW iff they're not a wall
  getNeighbors(coord: [number, number], to: vec2): [number, number][] {
    const [x, y] = coord
    const neighborList: [number, number][] = []

    const cur = this.nodes[vecToPos(coord)]
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
      // t2a function from editor
      const p = vec2.sub(vec2.create(), [x, y], this.map.origin)
      let score = 1

      if (
        dx != 0 &&
        this.map.entities[p[1] * this.map.dimensions[0] + p[0] + dx] ==
          Type.WALL
      ) {
        return
      }
      if (
        dy != 0 &&
        this.map.entities[(p[1] + dy) * this.map.dimensions[0] + p[0]] ==
          Type.WALL
      ) {
        return
      }
      if (dx != 0 && dy != 0) {
        // Diagonal movement
        score = Math.SQRT2
        if (
          this.map.entities[
            (p[1] + dy) * this.map.dimensions[0] + (p[0] + dx)
          ] == Type.WALL
        ) {
          return
        }
      }

      const pos = vecToPos([x + dx, y + dy])

      let neighborNode = this.nodes[pos]
      if (neighborNode) {
        // Update score and previous node
        // if a better path is found
        if (neighborNode.score > cur.score + score) {
          neighborNode.prev = [x, y]
          neighborNode.score = cur.score + score
          this.nodes[pos] = neighborNode
        }
      } else {
        // If we haven't seen this node before, record it on the
        // map, and add it to our potential search space
        neighborNode = {
          prev: [x, y],
          score: cur.score + score,
          distance: vec2.distance(vec2.fromValues(x + dx, y + dy), to),
        }
        this.nodes[pos] = neighborNode
        neighborList.push([x + dx, y + dy])
      }
    })

    return neighborList
  }
}
