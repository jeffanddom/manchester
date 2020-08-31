import { vec2 } from 'gl-matrix'

import { maps } from '~/assets/maps'
import { Client } from '~/Client'
import { ClientMessage } from '~/ClientMessage'
import { TILE_SIZE } from '~/constants'
import * as entities from '~/entities'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression } from '~/Game'
import { Map } from '~/map/interfaces'
import * as systems from '~/systems'
import * as terrain from '~/terrain'
import { convertToServerMessage } from '~/util/entities'

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

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    this.terrainLayer = new terrain.Layer({
      tileOrigin: this.map.origin,
      tileDimensions: this.map.dimensions,
      terrain: this.map.terrain,
    })

    // Populate entities
    for (let i = 0; i < this.map.dimensions[1]; i++) {
      for (let j = 0; j < this.map.dimensions[0]; j++) {
        const et = this.map.entities[i * this.map.dimensions[0] + j]
        if (et === null) {
          continue
        }

        const entity = entities.types.make(et)
        if (entity.transform !== undefined) {
          entity.transform.position = vec2.add(
            vec2.create(),
            this.terrainLayer.minWorldPos(),
            vec2.fromValues(
              j * TILE_SIZE + TILE_SIZE * 0.5,
              i * TILE_SIZE + TILE_SIZE * 0.5,
            ),
          )
        }

        this.entityManager.register(entity)
      }
    }

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

    // client message cleanup
    this.clientMessages = this.clientMessages.filter((m) => m.frame > frame)

    // Enqueue server state for the client
    const serverMessage = {
      frame,
      entities: convertToServerMessage(this.entityManager.entities),
    }

    /////// FIXME
    this.clients.forEach((client) => {
      client.serverMessages.push(serverMessage)
    })
  }
}
