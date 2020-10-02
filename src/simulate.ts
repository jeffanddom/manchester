import { ParticleEmitter } from './particles/ParticleEmitter'

import { EntityManager } from '~/entities/EntityManager'
import { GameState } from '~/Game'
import { ClientMessage } from '~/network/ClientMessage'
import * as systems from '~/systems'
import * as terrain from '~/terrain'

export type SimState = {
  entityManager: EntityManager
  messages: Array<ClientMessage>
  terrainLayer: terrain.Layer
  registerParticleEmitter?: (params: {
    emitter: ParticleEmitter
    entity: string
  }) => void
}

export const simulate = (
  simState: SimState,
  gameState: GameState,
  dt: number,
): void => {
  systems.transformInit(simState)

  if (gameState === GameState.Running) {
    systems.tankMover(simState, dt)

    // systems.hiding(this)
    // systems.builder(this, this.entityManager, dt)
    systems.shooter(simState)
    // systems.turret(this, dt)
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
