import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { Map } from '~/map/interfaces'
import { IClientConnection } from '~/network/ClientConnection'
import { ClientMessage } from '~/network/ClientMessage'
import { ServerMessageType } from '~/network/ServerMessage'
import { simulate } from '~/simulate'
import * as terrain from '~/terrain'

export class Server {
  clientMessages: ClientMessage[][]
  entityManager: EntityManager
  clientConnections: IClientConnection[]
  playerCount: number
  bufferTimer: number
  simulationFrame: number

  // Common game state
  state: GameState
  nextState: GameState | null

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor(config: { playerCount: number; clientBufferSize: number }) {
    this.clientMessages = []
    this.entityManager = new EntityManager()
    this.clientConnections = []
    this.playerCount = config.playerCount
    this.bufferTimer = config.clientBufferSize
    this.simulationFrame = 0

    // Common
    this.state = GameState.Connecting
    this.nextState = null

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })
  }

  connectClient(conn: IClientConnection): void {
    if (this.clientConnections.length === this.playerCount) {
      console.log('already reached maximum player count') // TODO: close connection
      return
    }

    this.clientConnections.push(conn)
    console.log(`connected player: ${this.clientConnections.length}`)
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  update(dt: number): void {
    // process incoming client messages
    for (const conn of this.clientConnections) {
      for (const msg of conn.received()) {
        if (msg.frame < this.simulationFrame) {
          continue
        }

        const index = msg.frame - this.simulationFrame

        // Ensure there is an array for the message's frame
        for (let i = this.clientMessages.length; i <= index; i++) {
          this.clientMessages.push([])
        }

        this.clientMessages[index].push(msg)
      }

      // Remove messages from connection's internal buffer
      conn.clear()
    }

    if (this.nextState) {
      this.state = this.nextState
      this.nextState = null

      switch (this.state) {
        case GameState.Running:
          this.entityManager = new EntityManager()

          const mapData = initMap(this.entityManager, this.currentLevel)
          this.map = mapData.map
          this.terrainLayer = mapData.terrainLayer

          this.clientConnections.forEach((conn, index) => {
            conn.send({
              type: ServerMessageType.START_GAME,
              playerNumber: index + 1,
            })
          })
          break
      }
    }

    switch (this.state) {
      case GameState.Connecting:
        {
          if (this.clientConnections.length === this.playerCount) {
            this.setState(GameState.Buffering)
          }
        }
        break

      case GameState.Buffering:
        {
          this.bufferTimer--
          if (this.bufferTimer <= 0) {
            this.setState(GameState.Running)
          }
        }
        break

      case GameState.Running:
        {
          // Remove this frame's client messages from the history, then process.
          const frameMessages = this.clientMessages.shift() || []
          if (frameMessages.length > 0) {
            console.log(
              `server: processing frame ${this.simulationFrame}, ${frameMessages.length} client messages`,
            )
          }

          simulate(
            {
              entityManager: this.entityManager,
              messages: frameMessages,
              terrainLayer: this.terrainLayer,
            },
            this.state,
            dt,
          )

          // send authoritative updates to clients
          this.clientConnections.forEach((conn) => {
            conn.send({
              type: ServerMessageType.FRAME_UPDATE,
              frame: this.simulationFrame,
              inputs: frameMessages,
            })
          })

          this.simulationFrame++
        }
        break
    }
  }
}
