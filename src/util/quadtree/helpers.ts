import { vec2 } from 'gl-matrix'

import * as aabb2 from '~/util/aabb2'

export interface QuadtreeItem<TId> {
  id: TId
}

export type Comparator<TItem> = (aabb: [vec2, vec2], item: TItem) => boolean

export enum Quadrant {
  NW,
  NE,
  SE,
  SW,
}

export type ChildList<TItem> = [
  TNode<TItem>,
  TNode<TItem>,
  TNode<TItem>,
  TNode<TItem>,
]

export type TNode<TItem> = {
  // parent?: TNode<T>
  children?: ChildList<TItem>
  items?: TItem[]
}

export const emptyNode = <TItem>(): TNode<TItem> => {
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
  if (!aabb2.overlap(a, b)) {
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
  parentAabb: [vec2, vec2],
  q: Quadrant,
): [vec2, vec2] => {
  const aabb = [vec2.clone(parentAabb[0]), vec2.clone(parentAabb[1])]
  const halfW = (aabb[1][0] - aabb[0][0]) / 2
  const halfH = (aabb[1][1] - aabb[0][1]) / 2

  switch (q) {
    case Quadrant.NW:
      return [aabb[0], vec2.fromValues(aabb[0][0] + halfW, aabb[0][1] + halfH)]
    case Quadrant.NE:
      return [
        vec2.fromValues(aabb[0][0] + halfW, aabb[0][1]),
        vec2.fromValues(aabb[1][0], aabb[0][1] + halfH),
      ]
    case Quadrant.SE:
      return [vec2.fromValues(aabb[0][0] + halfW, aabb[0][1] + halfH), aabb[1]]
    case Quadrant.SW:
      return [
        vec2.fromValues(aabb[0][0], aabb[0][1] + halfH),
        vec2.fromValues(aabb[0][0] + halfW, aabb[1][1]),
      ]
  }
}

export const nodeInsert = <TId, TItem extends QuadtreeItem<TId>>(
  node: TNode<TItem>,
  idMap: Map<TId, TNode<TItem>[]>,
  aabb: [vec2, vec2],
  maxItems: number,
  comparator: Comparator<TItem>,
  item: TItem,
): void => {
  if (!comparator(aabb, item)) {
    return
  }

  if (node.children !== undefined) {
    for (const q of [Quadrant.NW, Quadrant.NE, Quadrant.SE, Quadrant.SW]) {
      nodeInsert(
        node.children[q],
        idMap,
        quadrantOfAabb(aabb, q),
        maxItems,
        comparator,
        item,
      )
    }
    return
  }

  const items = node.items!
  items.push(item)

  let parentNodes = idMap.get(item.id)
  if (parentNodes === undefined) {
    parentNodes = []
    idMap.set(item.id, parentNodes)
  }

  parentNodes.push(node)

  if (items.length <= maxItems) {
    return
  }

  // Convert node from item node to branch node
  delete node.items
  node.children = [{ items: [] }, { items: [] }, { items: [] }, { items: [] }]
  for (const i of items) {
    const parentNodes = idMap.get(i.id)!
    const toRemove = parentNodes.indexOf(node)
    parentNodes.splice(toRemove, 1)

    nodeInsert(node, idMap, aabb, maxItems, comparator, i)
  }
}

export const nodeQuery = <TItem>(
  node: TNode<TItem>,
  nodeAabb: [vec2, vec2],
  comparator: Comparator<TItem>,
  queryAabb: [vec2, vec2],
): TItem[] => {
  if (!minBiasAabbOverlap(nodeAabb, queryAabb)) {
    return []
  }

  if (node.items !== undefined) {
    return node.items.filter((i) => comparator(queryAabb, i))
  }

  const children = node.children!
  const res: TItem[] = []

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

export function treeDepth<TItem>(root: TNode<TItem>): number {
  if (root.children === undefined) {
    return 1
  }

  return root.children.reduce(
    (accum, child) => Math.max(treeDepth(child) + 1, accum),
    -1,
  )
}
