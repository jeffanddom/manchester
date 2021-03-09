import { vec4 } from 'gl-matrix'

import { ParticleEmitter } from './particles/ParticleEmitter'

import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { GameState } from '~/Game'
import { ClientMessage } from '~/network/ClientMessage'
import * as systems from '~/systems'
import * as terrain from '~/terrain'

export enum SimulationPhase {
  ServerTick,
  ClientPrediction,
  ClientAuthoritative,
  ClientReprediction,
}

export function simulationPhaseDebugColor(
  out: vec4,
  phase: SimulationPhase,
): vec4 {
  switch (phase) {
    case SimulationPhase.ServerTick:
      return vec4.set(out, 0, 0, 0, 0)
    case SimulationPhase.ClientPrediction:
      return vec4.set(out, 1, 0, 0.8, 1)
    case SimulationPhase.ClientReprediction:
      return vec4.set(out, 0.8, 0.8, 0, 1)
    case SimulationPhase.ClientAuthoritative:
      return vec4.set(out, 0.2, 1, 0.2, 1)
  }
}

export type SimState = {
  entityManager: EntityManager
  messages: ClientMessage[]
  terrainLayer: terrain.Layer
  frame: number
  registerParticleEmitter?: (params: {
    emitter: ParticleEmitter
    entity: EntityId
    frame: number
  }) => void
  debugDraw: IDebugDrawWriter

  // Let's be SUPER judicious about when we actually use the phase property.
  // Ideally, we should only use it for diagnostics and debug, rather than for
  // actual business logic.
  phase: SimulationPhase
}

export const simulate = (
  simState: SimState,
  gameState: GameState,
  dt: number,
): void => {
  systems.transformInit(simState)

  systems.tankMover(simState, dt)
  systems.hiding(simState.entityManager)
  // systems.builder(this, this.entityManager, dt)
  systems.shooter(simState)
  systems.turret(simState, dt)
  systems.bullet(simState, dt)
  // systems.pickups(this, this.entityManager)
  systems.wallCollider(simState)
  systems.attack(simState)
  systems.playfieldClamping(simState)

  systems.damageable(simState)

  simState.entityManager.update()
}
