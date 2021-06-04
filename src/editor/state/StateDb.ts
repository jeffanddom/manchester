import { GridPos, cloneGridPos } from '~/editor/components/gridPos'
import {
  TileComponent,
  cloneTileComponent,
} from '~/editor/components/tileComponent'
import { ComponentTable } from '~/engine/state/ComponentTable'
import { EntityId } from '~/engine/state/EntityId'
import { StateDbBase } from '~/engine/state/StateDbBase'

export interface EntityConfig {
  model?: string
  gridPos?: GridPos
  tile?: TileComponent
  cursor?: number
}

export class StateDb extends StateDbBase<EntityConfig> {
  public currentPlayer?: number

  // components
  public models: ComponentTable<string>
  public gridPos: ComponentTable<GridPos>
  public tiles: ComponentTable<TileComponent>
  public cursors: ComponentTable<number>

  public constructor() {
    super()

    this.models = new ComponentTable((c) => c)
    this.gridPos = new ComponentTable(cloneGridPos)
    this.tiles = new ComponentTable(cloneTileComponent)
    this.cursors = new ComponentTable((c) => c)
  }

  protected addEntityToContainers(id: EntityId, e: EntityConfig): void {
    if (e.model !== undefined) {
      this.models.set(id, e.model)
    }

    if (e.gridPos !== undefined) {
      this.gridPos.set(id, e.gridPos)
    }

    if (e.tile !== undefined) {
      this.tiles.set(id, e.tile)
    }

    if (e.cursor !== undefined) {
      this.cursors.set(id, e.cursor)
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
