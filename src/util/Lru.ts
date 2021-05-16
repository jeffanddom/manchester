interface ListItem<TKey, TValue> {
  key: TKey
  value: TValue
  prev: ListItem<TKey, TValue> | undefined
  next: ListItem<TKey, TValue> | undefined
}

/**
 * An LRU-style cache.
 */
export class Lru<TKey extends string | number, TValue> {
  private capacity: number
  private list:
    | {
        head: ListItem<TKey, TValue>
        tail: ListItem<TKey, TValue>
      }
    | undefined
  private index: Map<TKey, ListItem<TKey, TValue>>

  public constructor(capacity: number) {
    if (capacity < 2) {
      throw `capacity ${capacity} is less than 2`
    }

    this.capacity = capacity
    this.list = undefined
    this.index = new Map()
  }

  public get(key: TKey): TValue | undefined {
    // Degenerate case: list is empty.
    if (this.list === undefined) {
      return undefined
    }

    const item = this.index.get(key)
    if (item === undefined) {
      return undefined
    }

    this.promoteItem(item)
    return item.value
  }

  public set(key: TKey, value: TValue): void {
    const item = this.index.get(key)
    if (item === undefined) {
      this.setNew(key, value)
      return
    }

    item.value = value
    this.promoteItem(item)
  }

  private setNew(key: TKey, value: TValue): void {
    if (this.list === undefined) {
      const newItem: ListItem<TKey, TValue> = {
        key,
        value,
        prev: undefined,
        next: undefined,
      }

      this.list = {
        head: newItem,
        tail: newItem,
      }

      this.index.set(key, newItem)
      return
    }

    // Create a new item at the head of the list.
    const newItem: ListItem<TKey, TValue> = {
      key,
      value,
      prev: undefined,
      next: this.list.head,
    }

    this.list.head.prev = newItem
    this.list.head = newItem

    // Index the item by key.
    this.index.set(key, newItem)

    // If we haven't reached capacity, we're done.
    if (this.index.size <= this.capacity) {
      return
    }

    // Otherwise, we're at capacity, and have to remove the old tail.
    const oldTail = this.list.tail

    // Clear the index item for the old tail.
    this.index.delete(oldTail.key)

    // Remove the tail item from the list.
    // Since the capacity is >= 2, tailItem.prev cannot be undefined.
    const newTail = oldTail.prev!
    this.list.tail = newTail
    newTail.next = undefined
  }

  /**
   * Promote a pre-existing item to the head of the list.
   */
  private promoteItem(item: ListItem<TKey, TValue>): void {
    if (this.list === undefined) {
      throw `invariant violation: linked list cannot be empty`
    }

    // If the item is the head of the list, no reorganization is required.
    if (item.prev === undefined) {
      return
    }

    // Remove the item from list.
    item.prev.next = item.next
    if (item.next !== undefined) {
      item.next.prev = item.prev
    } else {
      this.list.tail = item.prev
    }

    // Place the item at the front of the list.
    const prevHead = this.list.head
    this.list.head = item
    prevHead.prev = item
    item.prev = undefined
    item.next = prevHead
  }
}
