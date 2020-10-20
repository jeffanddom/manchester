import { vec2 } from 'gl-matrix'

import {
  Comparator,
  QuadtreeItem,
  TNode,
  nodeInsert,
  nodeQuery,
} from './helpers'

export class Quadtree<T extends QuadtreeItem> {
  private maxItems: number
  private aabb: [vec2, vec2] // NW and SE extrema
  private root: TNode<T>
  private idMap: { [key: string]: TNode<T>[] }
  private comparator: Comparator<T>

  constructor(config: {
    maxItems: number
    aabb: [vec2, vec2]
    comparator: Comparator<T>
  }) {
    this.maxItems = config.maxItems
    this.aabb = config.aabb
    this.root = { items: [] }
    this.idMap = {}
    this.comparator = config.comparator
  }

  public insert(item: T): void {
    nodeInsert(
      this.root,
      this.idMap,
      this.aabb,
      this.maxItems,
      this.comparator,
      item,
    )
  }

  public remove(id: string): void {
    const nodes = this.idMap[id] ?? []

    nodes.forEach((n) => {
      const indexToRemove = n.items!.findIndex((item) => item.id === id)
      n.items!.splice(indexToRemove, 1)
    })

    delete this.idMap[id]
  }

  public query(aabb: [vec2, vec2]): T[] {
    return nodeQuery(this.root, this.aabb, this.comparator, aabb)
  }
}
