import { SortedMap } from './SortedMap'

export class SortedSet<Tk> {
  private map: SortedMap<Tk, null>

  constructor() {
    this.map = new SortedMap()
  }

  add(k: Tk): void {
    this.map.set(k, null)
  }

  size(): number {
    return this.map.size()
  }

  has(k: Tk): boolean {
    return this.map.has(k)
  }

  delete(k: Tk): boolean {
    return this.map.delete(k)
  }

  *[Symbol.iterator](): Iterator<Tk> {
    for (const [id] of this.map) {
      yield id
    }
  }
}
