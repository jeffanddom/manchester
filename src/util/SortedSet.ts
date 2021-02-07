import { SortedMap } from './SortedMap'

export class SortedSet<Tk> {
  private map: SortedMap<Tk, undefined>

  constructor() {
    this.map = new SortedMap()
  }

  add(k: Tk): void {
    this.map.set(k, undefined)
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

  [Symbol.iterator](): Iterator<Tk> {
    const iterator = this.map[Symbol.iterator]()

    return {
      next: (): IteratorResult<Tk> => {
        const mapResult = iterator.next()
        if (mapResult.done === true) {
          return mapResult
        }
        return { done: false, value: mapResult.value[0] }
      },
    }
  }
}
