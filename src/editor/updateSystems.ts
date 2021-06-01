import { TileType } from './components/tileComponent'

import { StateDb } from '~/editor/state/StateDb'
import { IDebugDrawWriter } from '~/engine/DebugDraw'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { SimulationPhase } from '~/engine/network/SimulationPhase'

export type FrameState = {
  stateDb: StateDb
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
        tile: { type: tempMap[y * w + x] },
      })
    }
  }
}

export function updateSystems(_frameState: FrameState, _dt: number): void {
  return
}
