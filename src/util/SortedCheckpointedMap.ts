import { SortedMap } from './SortedMap'

interface Cloneable<T> {
  clone(): T
}

export class SortedCheckpointedMap<
  Tk,
  Tv extends Cloneable<Tv>
> extends SortedMap<Tk, Tv> {
  private checkpointed: Map<Tk, Tv>

  constructor() {
    super()

    this.checkpointed = new Map()
  }

  // Return a copy of the item to be mutated, and store
  // a checkpointed version in our map. If the map already
  // has a checkpoint for the object, don't update the checkpoint.
  checkpoint(k: Tk): Tv | undefined {
    const toCheckpoint = this.map.get(k)

    if (!toCheckpoint) {
      return
    }

    if (!this.checkpointed.has(k)) {
      this.checkpointed.set(k, toCheckpoint.clone())
    }

    return toCheckpoint
  }

  undoPrediction(): void {
    for (const [k, v] of this.checkpointed) {
      this.set(k, v)
    }
    this.checkpointed = new Map()
  }
}
