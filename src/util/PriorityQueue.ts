type Comparator<T> = (a: T, b: T) => number

/**
 * A priority queue, backed by a binary heap. The comparator is used to model
 * a min heap, meaning that lower ranks have higher priority.
 *
 * The implementation will grow internal capacity to fit usage, but will not
 * reclaim capacity as the queue shrinks.
 */
export class PriorityQueue<T> {
  private storage: Array<T> // length of storage is our capacity
  private _length: number
  private comparator: Comparator<T>

  public constructor(comparator: Comparator<T>) {
    this.storage = new Array(64)
    this._length = 0
    this.comparator = comparator
  }

  /**
   * Insert a new value into the queue. The length will increase by one.
   */
  public push(v: T): void {
    // If we are at capacity, we need to expand internal storage. We'll use the
    // conventional exponential growth heuristic.
    if (this.storage.length === this._length) {
      const newStorage = new Array(this.storage.length * 2)
      for (const i in this.storage) {
        newStorage[i] = this.storage[i]
      }
      this.storage = newStorage
    }

    // First, append to storage, breaking the heap property.
    let vPos = this._length
    this.storage[vPos] = v
    this._length += 1

    // Restore the heap property by bubbling up the value.
    while (vPos > 0) {
      const parent = Math.floor((vPos - 1) / 2)
      if (this.comparator(v, this.storage[parent]) >= 0) {
        // We're done; v is properly situated relative to parent.
        break
      }

      // swap parent with child
      this.storage[vPos] = this.storage[parent]
      this.storage[parent] = v
      vPos = parent
    }
  }

  /**
   * Remove the lowest ranking value from the queue, according to the
   * comparator. The value is returned. The length of the queue will decrease by
   * one.
   */
  public pop(): T | undefined {
    if (this._length === 0) {
      return undefined
    }

    const result = this.storage[0]

    // Move the last value to the top of the heap, breaking the heap property.
    const v = this.storage[this._length - 1]
    let vPos = 0
    this.storage[vPos] = v
    this._length -= 1

    // Push the top value downward, restoring the heap property.
    for (;;) {
      // We should replace the lowest ranking child whose rank is lower than
      // the rank of the current value.
      let swapPos = vPos

      const leftChild = 2 * vPos + 1
      if (
        leftChild < this._length &&
        this.comparator(this.storage[leftChild], this.storage[swapPos]) < 0
      ) {
        swapPos = leftChild
      }

      const rightChild = 2 * vPos + 2
      if (
        rightChild < this._length &&
        this.comparator(this.storage[rightChild], this.storage[swapPos]) < 0
      ) {
        swapPos = rightChild
      }

      if (swapPos === vPos) {
        // If neither child should be pushed up to the parent position, then
        // we're done.
        break
      }

      this.storage[vPos] = this.storage[swapPos]
      this.storage[swapPos] = v
      vPos = swapPos
    }

    return result
  }

  /**
   * Return the lowest ranking value from the queue, according to the comparator.
   */
  public peek(): T | undefined {
    if (this.storage.length === 0) {
      return undefined
    }

    return this.storage[0]
  }

  /**
   * Return the number of values currently in the queue.
   */
  public length(): number {
    return this._length
  }
}
