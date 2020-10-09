import { vec2 } from 'gl-matrix'

import { Comparator, TNode, nodeInsert, nodeQuery } from './helpers'

export class Quadtree<T> {
  private maxItems: number
  private aabb: [vec2, vec2] // NW and SE extrema
  private root: TNode<T>
  private comparator: Comparator<T>

  constructor(config: {
    maxItems: number
    aabb: [vec2, vec2]
    comparator: Comparator<T>
  }) {
    this.maxItems = config.maxItems
    this.aabb = config.aabb
    this.root = { items: [] }
    this.comparator = config.comparator
  }

  public insert(item: T): void {
    nodeInsert(this.root, this.aabb, this.maxItems, this.comparator, item)
  }

  public query(aabb: [vec2, vec2]): T[] {
    return nodeQuery(this.root, this.aabb, this.comparator, aabb)
  }
}
