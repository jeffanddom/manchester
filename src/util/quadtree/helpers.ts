import { vec2 } from 'gl-matrix'

import * as aabb2 from '~/util/aabb2'
import { Aabb2 } from '~/util/aabb2'

export interface QuadtreeItem<TId> {
  id: TId
}

export type Comparator<TItem> = (aabb: Aabb2, item: TItem) => boolean

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
export const minBiasAabbContains = (box: Aabb2, p: vec2): boolean => {
  return (
    box[aabb2.Elem.x1] <= p[0] &&
    p[0] < box[aabb2.Elem.x2] &&
    box[aabb2.Elem.y1] <= p[1] &&
    p[1] < box[aabb2.Elem.y2]
  )
}

/**
 * Tests whether two AABBs, specified by their NW/SE extrema, are overlapping.
 * The south and east edges of an AABB are not considered to be inside of the
 * AABB.
 */
export const minBiasAabbOverlap = (a: Aabb2, b: Aabb2): boolean => {
  if (!aabb2.overlap(a, b)) {
    return false
  }

  // Ensure that south/west edges are not counted.
  const leftmost = a[aabb2.Elem.x1] <= b[aabb2.Elem.x1] ? a : b
  const rightmost = a[aabb2.Elem.x1] <= b[aabb2.Elem.x1] ? b : a
  const upper = a[aabb2.Elem.y1] <= b[aabb2.Elem.y1] ? a : b
  const lower = a[aabb2.Elem.y1] <= b[aabb2.Elem.y1] ? b : a
  return (
    leftmost[aabb2.Elem.x2] !== rightmost[aabb2.Elem.x1] &&
    upper[aabb2.Elem.y2] !== lower[aabb2.Elem.y1]
  )
}

export const quadrantOfAabb = (parent: Aabb2, q: Quadrant): Aabb2 => {
  const halfW = (parent[aabb2.Elem.x2] - parent[aabb2.Elem.x1]) / 2
  const halfH = (parent[aabb2.Elem.y2] - parent[aabb2.Elem.y1]) / 2

  switch (q) {
    case Quadrant.NW:
      return [
        parent[aabb2.Elem.x1],
        parent[aabb2.Elem.y1],
        parent[aabb2.Elem.x1] + halfW,
        parent[aabb2.Elem.y1] + halfH,
      ]
    case Quadrant.NE:
      return [
        parent[aabb2.Elem.x1] + halfW,
        parent[aabb2.Elem.y1],
        parent[aabb2.Elem.x2],
        parent[aabb2.Elem.y1] + halfH,
      ]
    case Quadrant.SE:
      return [
        parent[aabb2.Elem.x1] + halfW,
        parent[aabb2.Elem.y1] + halfH,
        parent[aabb2.Elem.x2],
        parent[aabb2.Elem.y2],
      ]
    case Quadrant.SW:
      return [
        parent[aabb2.Elem.x1],
        parent[aabb2.Elem.y1] + halfH,
        parent[aabb2.Elem.x1] + halfW,
        parent[aabb2.Elem.y2],
      ]
  }
}

export const nodeInsert = <TId, TItem extends QuadtreeItem<TId>>(
  node: TNode<TItem>,
  idMap: Map<TId, TNode<TItem>[]>,
  aabb: Aabb2,
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
  nodeAabb: Aabb2,
  comparator: Comparator<TItem>,
  queryAabb: Aabb2,
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
