import { vec2 } from 'gl-matrix'

import { maps } from '~/assets/maps'
import { Client } from '~/Client'
import { ClientMessage } from '~/ClientMessage'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { Map } from '~/map/interfaces'
import * as systems from '~/systems'
import * as terrain from '~/terrain'

export class Server {
  clientMessages: ClientMessage[]
  entityManager: EntityManager
  clients: Client[]

  // Common game state
  state: GameState
  nextState: GameState | null

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor() {
    this.clientMessages = []
    this.entityManager = new EntityManager()
    this.clients = []

    // Common
    this.state = GameState.None
    this.nextState = null

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })
  }

  startPlay(): void {
    this.entityManager = new EntityManager()

    const mapData = initMap(this.entityManager, this.currentLevel)
    this.map = mapData.map
    this.terrainLayer = mapData.terrainLayer

    this.clients.forEach((client) => {
      // TODO: convert to client message
      client.setState(GameState.Running)
    })
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  update(dt: number, frame: number): void {
    if (this.nextState) {
      this.state = this.nextState
      this.nextState = null

      switch (this.state) {
        case GameState.Running:
          this.startPlay()
          break
        case GameState.YouDied:
          this.currentLevel = 0
          break
        case GameState.LevelComplete:
          this.currentLevel = (this.currentLevel + 1) % Object.keys(maps).length
          break
      }
    }

    systems.transformInit(this)

    if (this.state === GameState.Running) {
      systems.tankMover(
        {
          entityManager: this.entityManager,
          messages: this.clientMessages,
        },
        dt,
        frame,
      )
      // systems.hiding(this)
      // systems.builder(this, this.entityManager, dt)
      // systems.shooter(this, dt)
      // systems.turret(this, dt)
    }

    // systems.bullet(this, dt)
    // systems.pickups(this, this.entityManager)
    // systems.wallCollider(this)
    // systems.attack(this, this.entityManager)
    // systems.playfieldClamping(this)

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

    this.entityManager.update() // entity cleanup

    // send authoritative updates to clients
    const serverMessage = {
      frame,
      inputs: this.clientMessages.filter((m) => m.frame === frame),
    }

    this.clients.forEach((client) => {
      client.serverMessages.push(serverMessage)
    })

    // client message cleanup
    this.clientMessages = this.clientMessages.filter((m) => m.frame > frame)
  }
}
