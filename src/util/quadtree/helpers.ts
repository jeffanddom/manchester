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
  Node<TItem>,
  Node<TItem>,
  Node<TItem>,
  Node<TItem>,
]

export type Node<TItem> = {
  aabb: Aabb2
  children?: ChildList<TItem>
  items?: TItem[]
}

export const emptyNode = <TItem>(aabb: Aabb2): Node<TItem> => {
  return { aabb, items: [] }
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

export function quadrants(
  out: [Aabb2, Aabb2, Aabb2, Aabb2],
  aabb: Aabb2,
): [Aabb2, Aabb2, Aabb2, Aabb2] {
  const halfW = (aabb[aabb2.Elem.x2] - aabb[aabb2.Elem.x1]) / 2
  const halfH = (aabb[aabb2.Elem.y2] - aabb[aabb2.Elem.y1]) / 2

  out[Quadrant.NW][0] = aabb[aabb2.Elem.x1]
  out[Quadrant.NW][1] = aabb[aabb2.Elem.y1]
  out[Quadrant.NW][2] = aabb[aabb2.Elem.x1] + halfW
  out[Quadrant.NW][3] = aabb[aabb2.Elem.y1] + halfH

  out[Quadrant.NE][0] = aabb[aabb2.Elem.x1] + halfW
  out[Quadrant.NE][1] = aabb[aabb2.Elem.y1]
  out[Quadrant.NE][2] = aabb[aabb2.Elem.x2]
  out[Quadrant.NE][3] = aabb[aabb2.Elem.y1] + halfH

  out[Quadrant.SE][0] = aabb[aabb2.Elem.x1] + halfW
  out[Quadrant.SE][1] = aabb[aabb2.Elem.y1] + halfH
  out[Quadrant.SE][2] = aabb[aabb2.Elem.x2]
  out[Quadrant.SE][3] = aabb[aabb2.Elem.y2]

  out[Quadrant.SW][0] = aabb[aabb2.Elem.x1]
  out[Quadrant.SW][1] = aabb[aabb2.Elem.y1] + halfH
  out[Quadrant.SW][2] = aabb[aabb2.Elem.x1] + halfW
  out[Quadrant.SW][3] = aabb[aabb2.Elem.y2]

  return out
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
  node: Node<TItem>,
  idMap: Map<TId, Node<TItem>[]>,
  maxItems: number,
  comparator: Comparator<TItem>,
  item: TItem,
): void => {
  if (!comparator(node.aabb, item)) {
    return
  }

  if (node.children !== undefined) {
    nodeInsert(node.children[Quadrant.NW], idMap, maxItems, comparator, item)
    nodeInsert(node.children[Quadrant.NE], idMap, maxItems, comparator, item)
    nodeInsert(node.children[Quadrant.SE], idMap, maxItems, comparator, item)
    nodeInsert(node.children[Quadrant.SW], idMap, maxItems, comparator, item)
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

  const nodeQuadrants = quadrants(
    [aabb2.create(), aabb2.create(), aabb2.create(), aabb2.create()],
    node.aabb,
  )
  node.children = [
    emptyNode(nodeQuadrants[Quadrant.NW]),
    emptyNode(nodeQuadrants[Quadrant.NE]),
    emptyNode(nodeQuadrants[Quadrant.SE]),
    emptyNode(nodeQuadrants[Quadrant.SW]),
  ]

  for (const i of items) {
    const parentNodes = idMap.get(i.id)!
    const toRemove = parentNodes.indexOf(node)
    parentNodes.splice(toRemove, 1)
    nodeInsert(node, idMap, maxItems, comparator, i)
  }
}

export const nodeQuery = <TItem>(
  out: TItem[],
  node: Node<TItem>,
  comparator: Comparator<TItem>,
  queryAabb: Aabb2,
): TItem[] => {
  if (!minBiasAabbOverlap(node.aabb, queryAabb)) {
    return out
  }

  if (node.items !== undefined) {
    for (const i of node.items) {
      if (comparator(queryAabb, i)) {
        out.push(i)
      }
    }
  } else {
    const children = node.children!
    nodeQuery(out, children[Quadrant.NW], comparator, queryAabb)
    nodeQuery(out, children[Quadrant.NE], comparator, queryAabb)
    nodeQuery(out, children[Quadrant.SE], comparator, queryAabb)
    nodeQuery(out, children[Quadrant.SW], comparator, queryAabb)
  }

  return out
}

export function treeDepth<TItem>(root: Node<TItem>): number {
  if (root.children === undefined) {
    return 1
  }

  return root.children.reduce(
    (accum, child) => Math.max(treeDepth(child) + 1, accum),
    -1,
  )
}
