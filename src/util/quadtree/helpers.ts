import { vec2 } from 'gl-matrix'

import { aabbOverlap } from '../math'

export type Comparator<T> = (aabb: [vec2, vec2], item: T) => boolean

export enum Quadrant {
  NW,
  NE,
  SE,
  SW,
}

export type ChildList<T> = [TNode<T>, TNode<T>, TNode<T>, TNode<T>]

export type TNode<T> = {
  children?: ChildList<T>
  items?: T[]
}

export const emptyNode = <T>(): TNode<T> => {
  return { items: [] }
}

/**
 * Tests whether a point falls within an AABB, specified by the NW and SE
 * extrema. Points along the north and west edges are considered to be within
 * the AABB, whereas points along the south and east edges are not.
 */
export const minBiasAabbContains = (aabb: [vec2, vec2], p: vec2): boolean => {
  return (
    aabb[0][0] <= p[0] &&
    p[0] < aabb[1][0] &&
    aabb[0][1] <= p[1] &&
    p[1] < aabb[1][1]
  )
}

/**
 * Tests whether two AABBs, specified by their NW/SE extrema, are overlapping.
 * The south and east edges of an AABB are not considered to be inside of the
 * AABB.
 */
export const minBiasAabbOverlap = (
  a: [vec2, vec2],
  b: [vec2, vec2],
): boolean => {
  if (!aabbOverlap(a, b)) {
    return false
  }

  // Ensure that south/west edges are not counted.
  const leftmost = a[0][0] <= b[0][0] ? a : b
  const rightmost = a[0][0] <= b[0][0] ? b : a
  const upper = a[0][1] <= b[0][1] ? a : b
  const lower = a[0][1] <= b[0][1] ? b : a
  return leftmost[1][0] !== rightmost[0][0] && upper[1][1] !== lower[0][1]
}

export const quadrantOfAabb = (
  _aabb: [vec2, vec2],
  q: Quadrant,
): [vec2, vec2] => {
  const aabb = [vec2.clone(_aabb[0]), vec2.clone(_aabb[1])]
  const halfW = (aabb[1][0] - aabb[0][0]) / 2
  const halfH = (aabb[1][1] - aabb[0][1]) / 2

  switch (q) {
    case Quadrant.NW:
      return [aabb[0], vec2.fromValues(aabb[0][0] + halfW, aabb[0][0] + halfH)]
    case Quadrant.NE:
      return [
        vec2.fromValues(aabb[0][0] + halfW, aabb[0][0]),
        vec2.fromValues(aabb[1][0], aabb[0][0] + halfH),
      ]
    case Quadrant.SE:
      return [vec2.fromValues(aabb[0][0] + halfW, aabb[0][0] + halfH), aabb[1]]
    case Quadrant.SW:
      return [
        vec2.fromValues(aabb[0][0], aabb[0][0] + halfH),
        vec2.fromValues(aabb[0][0] + halfW, aabb[1][1]),
      ]
  }
}

export const nodeInsert = <T>(
  node: TNode<T>,
  aabb: [vec2, vec2],
  maxItems: number,
  comparator: Comparator<T>,
  item: T,
  depth = 0,
): void => {
  if (!comparator(aabb, item)) {
    return
  }

  console.log(
    '-> Inserting into ',
    aabb,
    '# items',
    node.items?.length,
    'ID',
    item,
    'Depth',
    depth,
  )

  if (node.children) {
    nodeInsert(
      node.children[Quadrant.NW],
      quadrantOfAabb(aabb, Quadrant.NW),
      maxItems,
      comparator,
      item,
      depth + 1,
    )
    nodeInsert(
      node.children[Quadrant.NE],
      quadrantOfAabb(aabb, Quadrant.NE),
      maxItems,
      comparator,
      item,
      depth + 1,
    )
    nodeInsert(
      node.children[Quadrant.SE],
      quadrantOfAabb(aabb, Quadrant.SE),
      maxItems,
      comparator,
      item,
      depth + 1,
    )
    nodeInsert(
      node.children[Quadrant.SW],
      quadrantOfAabb(aabb, Quadrant.SW),
      maxItems,
      comparator,
      item,
      depth + 1,
    )
    return
  }

  const items = node.items!
  items.push(item)
  if (items.length <= maxItems) {
    return
  }

  // Convert node from item node to branch node
  delete node.items
  node.children = [{ items: [] }, { items: [] }, { items: [] }, { items: [] }]
  for (const i of items) {
    console.log('Splitting -> Inserting items into child nodes', i)
    nodeInsert(node, aabb, maxItems, comparator, i, depth)
  }
}

export const nodeQuery = <T>(
  node: TNode<T>,
  nodeAabb: [vec2, vec2],
  comparator: Comparator<T>,
  queryAabb: [vec2, vec2],
): T[] => {
  if (!minBiasAabbOverlap(nodeAabb, queryAabb)) {
    return []
  }

  if (node.items) {
    return node.items.filter((i) => comparator(queryAabb, i))
  }

  const children = node.children!
  const res: T[] = []

  for (const q of [Quadrant.NW, Quadrant.NE, Quadrant.SE, Quadrant.SW]) {
    for (const i of nodeQuery(
      children[q],
      quadrantOfAabb(nodeAabb, q),
      comparator,
      queryAabb,
    )) {
      res.push(i)
    }
  }

  return res
}
