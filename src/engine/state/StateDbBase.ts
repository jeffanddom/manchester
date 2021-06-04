import { EntityId } from '~/engine/state/EntityId'
import { EntityStateContainer } from '~/engine/state/EntityStateContainer'
import { SortedSet } from '~/util/SortedSet'

export interface RollbackableDb {
  commitPrediction(): void
  undoPrediction(): void
}

export abstract class StateDbBase<TEntityConfig> implements RollbackableDb {
  private nextEntityIdUncommitted: number
  private nextEntityIdCommitted: number
  private toDelete: SortedSet<EntityId>
  private predictedDeletes: SortedSet<EntityId>
  private predictedRegistrations: SortedSet<EntityId>
  private allContainers: EntityStateContainer[]

  protected constructor() {
    this.nextEntityIdUncommitted = 0
    this.nextEntityIdCommitted = 0
    this.toDelete = new SortedSet()
    this.predictedDeletes = new SortedSet()
    this.predictedRegistrations = new SortedSet()
    this.allContainers = []
  }

  public registerEntity(entityConfig: TEntityConfig): number {
    const id = this.nextEntityIdUncommitted as EntityId
    this.nextEntityIdUncommitted++
    this.predictedRegistrations.add(id)

    this.addEntityToContainers(id, entityConfig)
    this.indexEntity(id)
    return id
  }

  public markEntityForDeletion(id: EntityId): void {
    this.toDelete.add(id)
  }

  public commitPrediction(): void {
    for (const container of this.allContainers) {
      container.commit()
    }

    this.nextEntityIdCommitted = this.nextEntityIdUncommitted
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()
  }

  public undoPrediction(): void {
    // Make sure to unindex using the current container state.
    for (const id of this.predictedRegistrations) {
      this.unindexEntity(id)
    }

    for (const container of this.allContainers) {
      container.rollback()
    }

    for (const id of this.predictedDeletes) {
      this.indexEntity(id)
    }

    this.nextEntityIdUncommitted = this.nextEntityIdCommitted
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()
  }

  public postFrameUpdate(): void {
    for (const id of this.toDelete) {
      // Make sure to unindex using the current container state.
      this.unindexEntity(id)

      for (const container of this.allContainers) {
        container.delete(id)
      }

      if (this.predictedRegistrations.has(id)) {
        // Single-frame entity case
        this.predictedRegistrations.delete(id)
      } else {
        this.predictedDeletes.add(id)
      }
    }

    this.toDelete = new SortedSet()

    this.indexesFrameUpdate()
  }

  protected addStateContainers(containers: EntityStateContainer[]): void {
    this.allContainers.push(...containers)
  }

  protected abstract addEntityToContainers(
    id: EntityId,
    entityConfig: TEntityConfig,
  ): void
  protected abstract indexEntity(id: EntityId): void
  protected abstract unindexEntity(id: EntityId): void
  protected abstract indexesFrameUpdate(): void
}
