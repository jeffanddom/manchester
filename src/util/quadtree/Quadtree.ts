import { vec2 } from 'gl-matrix'

import {
  Comparator,
  QuadtreeItem,
  TNode,
  nodeInsert,
  nodeQuery,
} from './helpers'

export class Quadtree<TId, TItem extends QuadtreeItem<TId>> {
  private maxItems: number
  private aabb: [vec2, vec2] // NW and SE extrema
  private root: TNode<TItem>
  private idMap: Map<TId, TNode<TItem>[]>
  private comparator: Comparator<TItem>

  constructor(config: {
    maxItems: number
    aabb: [vec2, vec2]
    comparator: Comparator<TItem>
  }) {
    this.maxItems = config.maxItems
    this.aabb = config.aabb
    this.root = { items: [] }
    this.idMap = new Map()
    this.comparator = config.comparator
  }

  public insert(item: TItem): void {
    if (this.idMap.has(item.id)) {
      this.remove(item.id)
    }

    nodeInsert(
      this.root,
      this.idMap,
      this.aabb,
      this.maxItems,
      this.comparator,
      item,
    )
  }

  public remove(id: TId): void {
    const parentNodes = this.idMap.get(id) ?? []

    parentNodes.forEach((n) => {
      const indexToRemove = n.items!.findIndex((item) => item.id === id)
      n.items!.splice(indexToRemove, 1)
    })

    this.idMap.delete(id)
  }

  public query(aabb: [vec2, vec2]): TItem[] {
    return nodeQuery(this.root, this.aabb, this.comparator, aabb)
  }
}
