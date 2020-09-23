import { ClientMessage } from '~/ClientMessage'
import { EntityManager } from '~/entities/EntityManager'
import { GameState } from '~/Game'
import * as systems from '~/systems'
import * as terrain from '~/terrain'

export const simulate = (
  simState: {
    entityManager: EntityManager
    messages: Array<ClientMessage>
    terrainLayer: terrain.Layer
  },
  gameState: GameState,
  dt: number,
): void => {
  if (gameState === GameState.Running) {
    systems.tankMover(simState, dt)

    // systems.hiding(this)
    // systems.builder(this, this.entityManager, dt)
    systems.shooter(simState)
    // systems.turret(this, dt)
  }

  // systems.bullet(this, dt)
  // systems.pickups(this, this.entityManager)
  // systems.wallCollider(this)
  // systems.attack(this, this.entityManager)
  systems.playfieldClamping(simState)

  // systems.damageable(this, this.entityManager)

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
