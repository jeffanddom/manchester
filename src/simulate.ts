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

export function simulationPhaseDebugColor(phase: SimulationPhase): vec4 {
  switch (phase) {
    case SimulationPhase.ServerTick:
      return vec4.fromValues(0, 0, 0, 0)
    case SimulationPhase.ClientPrediction:
      return vec4.fromValues(1, 0, 0.8, 1)
    case SimulationPhase.ClientReprediction:
      return vec4.fromValues(0.8, 0.8, 0, 1)
    case SimulationPhase.ClientAuthoritative:
      return vec4.fromValues(0.2, 1, 0.2, 1)
  }
}

export type SimState = {
  entityManager: EntityManager
  messages: Array<ClientMessage>
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

  if (gameState === GameState.Running) {
    systems.tankMover(simState, dt)
    systems.hiding(simState.entityManager)
    // systems.builder(this, this.entityManager, dt)
    systems.shooter(simState)
    // systems.turret(simState, dt)
  }

  systems.bullet(simState, dt)
  // systems.pickups(this, this.entityManager)
  systems.wallCollider(simState)
  systems.attack(simState)
  systems.playfieldClamping(simState)

  systems.damageable(simState)

  // TODO: need mechanism to sync state with client
  // if (this.state === GameState.YouDied) {
  // 'r' for restart
  // if (this.client.keyboard.upKeys.has(82)) {
  //   this.setState(GameState.Running)
  // }
  // }

  // if (this.state === GameState.Running) {
  //   systems.levelCompletion(this)
  // }

  // TODO: need mechanism to sync state with client
  // if (this.state === GameState.LevelComplete) {
  // if (this.client.keyboard.upKeys.has(32)) {
  //   this.setState(GameState.Running)
  // }
  // }

  simState.entityManager.update()
}
