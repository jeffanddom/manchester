import { EntityType, TileType } from './components/tileComponent'
import { LocalState } from './state/LocalState'
import { updateTileEditSystem } from './systems/tileEdit'

import { ClientMessage } from '~/editor/messages'
import { StateDb } from '~/editor/state/StateDb'
import { updateCursorSystem } from '~/editor/systems/cursor'
import { IDebugDrawWriter } from '~/engine/DebugDraw'
import { SimulationPhase } from '~/engine/network/SimulationPhase'

export type FrameState = {
  stateDb: StateDb
  localState: LocalState
  messages: ClientMessage[]
  frame: number
  debugDraw: IDebugDrawWriter

  // Let's be SUPER judicious about when we actually use the phase property.
  // Ideally, we should only use it for diagnostics and debug, rather than for
  // actual business logic.
  phase: SimulationPhase
}

export function initSystems(stateDb: StateDb): void {
  // prettier-ignore
  const tempMap: TileType[] = [
    TileType.Grass, TileType.Water, TileType.Water, TileType.Water,
    TileType.Grass, TileType.Road, TileType.Road, TileType.Road,
    TileType.Grass, TileType.Road, TileType.Mountain, TileType.Mountain,
    TileType.Grass, TileType.Road, TileType.Mountain, TileType.Mountain,
  ]
  const w = 4
  const h = 4

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      stateDb.registerEntity({
        model: 'tile',
        gridPos: { x, y },
        tile: { type: tempMap[y * w + x], entity: EntityType.Tank },
      })
    }
  }

  stateDb.commitPrediction()
}

export function updateSystems(frameState: FrameState, _dt: number): void {
  updateCursorSystem(frameState)
  updateTileEditSystem(frameState)
}
