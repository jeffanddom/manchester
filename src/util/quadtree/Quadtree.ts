import {
  Comparator,
  Node,
  QuadtreeItem,
  nodeInsert,
  nodeQuery,
  treeDepth,
} from './helpers'

import { Aabb2 } from '~/util/aabb2'

export class Quadtree<TId, TItem extends QuadtreeItem<TId>> {
  private maxItems: number
  private root: Node<TItem>
  private idMap: Map<TId, Node<TItem>[]>
  private comparator: Comparator<TItem>

  constructor(config: {
    maxItems: number
    aabb: Aabb2
    comparator: Comparator<TItem>
  }) {
    this.maxItems = config.maxItems
    this.root = { aabb: config.aabb, items: [] }
    this.idMap = new Map()
    this.comparator = config.comparator
  }

  public insert(item: TItem): void {
    if (this.idMap.has(item.id)) {
      this.remove(item.id)
    }

    nodeInsert(this.root, this.idMap, this.maxItems, this.comparator, item)
  }

  public remove(id: TId): void {
    const parentNodes = this.idMap.get(id) ?? []

    parentNodes.forEach((n) => {
      const indexToRemove = n.items!.findIndex((item) => item.id === id)
      n.items!.splice(indexToRemove, 1)
    })

    this.idMap.delete(id)
  }

  public query(aabb: Aabb2): TItem[] {
    return nodeQuery([], this.root, this.comparator, aabb)
  }

  public depth(): number {
    return treeDepth(this.root)
  }
}
