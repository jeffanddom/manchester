import { EntityConfig } from '~/editor/state/EntityConfig'
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
  const newMap: EntityConfig = {
    map: {
      width: 32,
      height: 32,
      tiles: new Uint8Array(32 * 32),
    },
  }

  stateDb.registerEntity(newMap)
}

export function updateSystems(_frameState: FrameState, _dt: number): void {
  return
}
