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

const newNode = (): Node => {
  return { score: Number.MAX_VALUE, distance: Number.MAX_VALUE, prev: null }
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
    const startNode = newNode()
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
        while (node.prev) {
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
          return nodeA!.distance - nodeB!.distance
        })
    }

    return []
  }

  // Add nodes with distances for NSEW iff they're not a wall
  getNeighbors(coord: [number, number], to: vec2): [number, number][] {
    const [x, y] = coord
    const neighborList: [number, number][] = []

    const cur = this.nodes[vecToPos(coord)]
    ;[
      [x, y - 1], // North
      [x, y + 1], // South
      [x - 1, y], // West
      [x + 1, y], // East
      // TODO - add diagonals?
    ].forEach(([nx, ny]) => {
      // t2a function from editor
      const p = vec2.sub(vec2.create(), [nx, ny], this.map.origin)
      if (
        this.map.entities[p[1] * this.map.dimensions[0] + p[0]] != Type.WALL
      ) {
        const pos = vecToPos([nx, ny])

        let neighborNode = this.nodes[pos]
        if (neighborNode) {
          // Update score and previous node
          // if a better path is found
          if (neighborNode.score > cur.score + 1) {
            neighborNode.prev = [x, y]
            neighborNode.score = cur.score + 1
            this.nodes[pos] = neighborNode
          }
        } else {
          // If we haven't seen this node before, record it on the
          // map, and add it to our potential search space
          neighborNode = {
            prev: [x, y],
            score: cur.score + 1,
            distance: vec2.distance(vec2.fromValues(nx, ny), to),
          }
          this.nodes[pos] = neighborNode
          neighborList.push([nx, ny])
        }
      }
    })

    return neighborList
  }
}
