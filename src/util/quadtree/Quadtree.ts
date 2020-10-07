import { vec2 } from 'gl-matrix'

import { TItem, TNode, nodeInsert, nodeQuery } from './helpers'

export class Quadtree<T extends TItem> {
  private maxItems: number
  private aabb: [vec2, vec2] // NW and SE extrema
  private root: TNode<T>

  constructor(config: { maxItems: number; aabb: [vec2, vec2] }) {
    this.maxItems = config.maxItems
    this.aabb = config.aabb
    this.root = { items: [] }
  }

  public insert(item: T): void {
    nodeInsert(this.root, this.aabb, this.maxItems, item)
  }

  public query(aabb: [vec2, vec2]): T[] {
    return nodeQuery(this.root, this.aabb, aabb)
  }
}
