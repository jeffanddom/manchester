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

  // indexes
  private tileIds: (EntityId | undefined)[]

  public constructor() {
    super()

    this.models = new ComponentTable((c) => c)
    this.gridPos = new ComponentTable(cloneGridPos)
    this.tiles = new ComponentTable(cloneTileComponent)
    this.cursors = new ComponentTable((c) => c)

    this.tileIds = new Array(64 * 64)
  }

  public getTileByGridPos(x: number, y: number): EntityId | undefined {
    return this.tileIds[y * 64 + x]
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

  protected indexEntity(id: EntityId): void {
    if (this.tiles.has(id)) {
      const gridPos = this.gridPos.get(id)!
      this.tileIds[gridPos.y * 64 + gridPos.x] = id
    }
  }

  protected unindexEntity(id: EntityId): void {
    if (this.tiles.has(id)) {
      const gridPos = this.gridPos.get(id)!
      this.tileIds[gridPos.y * 64 + gridPos.x] = undefined
    }
  }

  protected indexesFrameUpdate(): void {
    //
  }
}
