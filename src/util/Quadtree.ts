import { vec2 } from 'gl-matrix'

interface TItem {
  pos(): vec2
}

export enum Quadrant {
  NW,
  NE,
  SE,
  SW,
}

export type ChildList<T extends TItem> = [
  TNode<T>,
  TNode<T>,
  TNode<T>,
  TNode<T>,
]

export type TNode<T extends TItem> = {
  children?: ChildList<T>
  items?: T[]
}

export const emptyNode = <T extends TItem>(): TNode<T> => {
  return { items: [] }
}

const aabbContains = (aabb: [vec2, vec2], p: vec2): boolean => {
  return (
    aabb[0][0] <= p[0] &&
    p[0] < aabb[1][0] &&
    aabb[0][1] <= p[1] &&
    p[1] < aabb[1][1]
  )
}

export const quadrantOfAabb = (
  aabb: [vec2, vec2],
  q: Quadrant,
): [vec2, vec2] => {
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

export const nodeInsert = <T extends TItem>(
  node: TNode<T>,
  aabb: [vec2, vec2],
  maxItems: number,
  item: T,
): void => {
  if (!aabbContains(aabb, item.pos())) {
    return
  }

  if (node.children) {
    nodeInsert(
      node.children[Quadrant.NW],
      quadrantOfAabb(aabb, Quadrant.NW),
      maxItems,
      item,
    )
    nodeInsert(
      node.children[Quadrant.NE],
      quadrantOfAabb(aabb, Quadrant.NE),
      maxItems,
      item,
    )
    nodeInsert(
      node.children[Quadrant.SE],
      quadrantOfAabb(aabb, Quadrant.SE),
      maxItems,
      item,
    )
    nodeInsert(
      node.children[Quadrant.SW],
      quadrantOfAabb(aabb, Quadrant.SW),
      maxItems,
      item,
    )
    return
  }

  const items = node.items!
  if (items.length < maxItems) {
    items.push(item)
    return
  }

  // Convert node from item node to branch node
  delete node.items
  node.children = [{ items: [] }, { items: [] }, { items: [] }, { items: [] }]
  for (const i of items) {
    nodeInsert(node, aabb, maxItems, i)
  }

  nodeInsert(node, aabb, maxItems, item)
}

export class Quadtree<T extends TItem> {
  maxItems: number
  root: TNode<T>

  constructor(config: { maxItems: number }) {
    this.maxItems = config.maxItems
    this.root = { items: [] }
  }

  insert(item: T): void {
    this.root.items!.push(item)
  }

  query(aabb: [vec2, vec2]): T[] {
    const res: T[] = []
    for (const i of this.root.items!) {
      if (aabbContains(aabb, i.pos())) {
        res.push(i)
      }
    }
    return res
  }
}
