export class SortedMap<Tk, Tv> {
  private map: Map<Tk, Tv>
  private sortedKeys: Tk[]

  constructor() {
    this.map = new Map()
    this.sortedKeys = []
  }

  set(k: Tk, v: Tv): void {
    if (this.map.has(k)) {
      this.map.set(k, v)
      return
    }

    this.map.set(k, v)
    this.sortedKeys.push(k)

    for (let i = this.sortedKeys.length - 1; i > 0; i--) {
      const left = i - 1
      const right = i
      if (this.sortedKeys[left] < this.sortedKeys[right]) {
        break
      }

      const temp = this.sortedKeys[left]
      this.sortedKeys[left] = this.sortedKeys[right]
      this.sortedKeys[right] = temp
    }
  }

  get(k: Tk): Tv | undefined {
    return this.map.get(k)
  }

  size(): number {
    return this.map.size
  }

  has(k: Tk): boolean {
    return this.map.has(k)
  }

  delete(k: Tk): boolean {
    if (!this.map.delete(k)) {
      return false
    }

    const i = this.sortedKeys.indexOf(k)
    this.sortedKeys.splice(i, 1)

    return true
  }

  [Symbol.iterator](): Iterator<[Tk, Tv]> {
    let i = 0

    return {
      next: (): IteratorResult<[Tk, Tv]> => {
        if (i >= this.sortedKeys.length) {
          return { done: true, value: undefined }
        }

        const k = this.sortedKeys[i]
        const value: [Tk, Tv] = [k, this.map.get(k)!]
        const result = {
          done: false,
          value,
        }

        i++

        return result
      },
    }
  }
}
