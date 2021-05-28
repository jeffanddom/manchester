import { EntityConfig } from '~/editor/state/EntityConfig'
import { EditorMap, cloneMap } from '~/editor/systems/map'
import { ComponentTable } from '~/engine/state/ComponentTable'
import { EntityId } from '~/engine/state/EntityId'
// import { EntitySet } from '~/engine/state/EntitySet'
import { StateDbBase } from '~/engine/state/StateDbBase'

export class StateDb extends StateDbBase<EntityConfig> {
  // components
  public maps: ComponentTable<EditorMap>

  public constructor() {
    super()

    this.maps = new ComponentTable<EditorMap>((c) => cloneMap(c))
  }

  protected addEntityToContainers(id: EntityId, e: EntityConfig): void {
    if (e.map !== undefined) {
      this.maps.set(id, e.map)
    }
  }

  protected indexEntity(_id: EntityId): void {
    //
  }
  protected unindexEntity(_id: EntityId): void {
    //
  }
  protected indexesFrameUpdate(): void {
    //
  }
}
