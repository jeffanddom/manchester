import { BufferArray } from './interfaces'

import * as set from '~/util/set'

/**
 * Given an array of triangle indices (an element array buffer for a triangle
 * primitive), returns an array of index pairs that define the solidwire edges.
 * This is the set of all triangle edges, minus those that are shared by
 * co-planar triangles.
 */
export function getSolidwireEdges(triIndices: BufferArray): number[] {
  const trisByVert: Map<number, Set<number>> = new Map()
  for (let i = 0; i < triIndices.length; i++) {
    const vert = triIndices[i]

    let list = trisByVert.get(vert)
    if (list === undefined) {
      list = new Set()
      trisByVert.set(vert, list)
    }

    const tri = Math.floor(i / 3)
    list.add(tri)
  }

  const lineIndices: number[] = []
  for (let t = 0; t < triIndices.length / 3; t++) {
    const a = triIndices[t * 3 + 0]
    const b = triIndices[t * 3 + 1]
    const c = triIndices[t * 3 + 2]
    for (const [v1, v2] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      if (
        set.intersection(trisByVert.get(v1)!, trisByVert.get(v2)!).size === 1
      ) {
        lineIndices.push(v1)
        lineIndices.push(v2)
      }
    }
  }

  return lineIndices
}
