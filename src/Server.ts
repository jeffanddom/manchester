import { vec2 } from 'gl-matrix'

import { simulate } from './simulate'

import { maps } from '~/assets/maps'
import { Client } from '~/Client'
import { ClientMessage } from '~/ClientMessage'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { Map } from '~/map/interfaces'
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

    simulate(
      {
        entityManager: this.entityManager,
        messages: this.clientMessages.filter((m) => m.frame === frame),
        terrainLayer: this.terrainLayer,
      },
      this.state,
      dt,
    )

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
