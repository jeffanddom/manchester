import { EntityId } from '~/entities/EntityId'
import { SortedSet } from '~/util/SortedSet'

export class EntitySet {
  private contents: SortedSet<EntityId>
  private uncommittedAdds: Set<EntityId>
  private uncommittedDeletes: Set<EntityId>

  constructor() {
    this.contents = new SortedSet()
    this.uncommittedAdds = new Set()
    this.uncommittedDeletes = new Set()
  }

  add(id: EntityId): void {
    this.contents.add(id)
    this.uncommittedAdds.add(id)
  }

  delete(id: EntityId): boolean {
    if (!this.contents.has(id)) {
      return false
    }

    if (!this.uncommittedAdds.has(id)) {
      this.uncommittedDeletes.add(id)
    }

    return this.contents.delete(id)
  }

  has(id: EntityId): boolean {
    return this.contents.has(id)
  }

  [Symbol.iterator](): Iterator<EntityId> {
    const iterator = this.contents[Symbol.iterator]()
    return {
      next: () => iterator.next(),
    }
  }

  rollback(): void {
    for (const id of this.uncommittedDeletes) {
      this.contents.add(id)
    }

    for (const id of this.uncommittedAdds) {
      this.contents.delete(id)
    }

    this.uncommittedAdds = new Set()
    this.uncommittedDeletes = new Set()
  }

  commit(): void {
    this.uncommittedAdds = new Set()
    this.uncommittedDeletes = new Set()
  }
}
