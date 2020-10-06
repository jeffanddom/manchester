import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import { GameState, initMap } from '~/Game'
import { Map } from '~/map/interfaces'
import { IClientConnection } from '~/network/ClientConnection'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { ServerMessageType } from '~/network/ServerMessage'
import { simulate } from '~/simulate'
import * as terrain from '~/terrain'

export class Server {
  entityManager: EntityManager

  // A buffer of unprocessed client messages received from clients. The messages
  // are grouped by frame, and the groups are indexed by the number of frames
  // ahead of the server's current frame.
  clientMessagesByFrame: ClientMessage[][]
  clients: {
    frame: number
    conn: IClientConnection
  }[]
  playerCount: number
  minFramesBehindClient: number
  simulationFrame: number
  maxReceivedClientFrame: number

  // Common game state
  state: GameState
  nextState: GameState | null

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor(config: { playerCount: number; minFramesBehindClient: number }) {
    this.clientMessagesByFrame = []
    this.entityManager = new EntityManager()
    this.clients = []
    this.playerCount = config.playerCount
    this.minFramesBehindClient = config.minFramesBehindClient
    this.simulationFrame = 0
    this.maxReceivedClientFrame = -1

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
    if (this.clients.length === this.playerCount) {
      console.log('already reached maximum player count') // TODO: close connection
      return
    }

    this.clients.push({
      frame: -1,
      conn,
    })
    console.log(`connected player: ${this.clients.length}`)
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  update(dt: number): void {
    // process incoming client messages
    for (const client of this.clients) {
      for (const msg of client.conn.consume()) {
        if (msg.type === ClientMessageType.FRAME_END) {
          client.frame = msg.frame

          // Set a high-water mark for the fastest client.
          this.maxReceivedClientFrame = Math.max(
            this.maxReceivedClientFrame,
            client.frame,
          )

          const framesBehindLeader = this.maxReceivedClientFrame - client.frame
          if (framesBehindLeader > this.minFramesBehindClient) {
            client.conn.send({ type: ServerMessageType.SPEED_UP })
          } else if (
            this.minFramesBehindClient / 2 >= framesBehindLeader ||
            client.frame === this.maxReceivedClientFrame
          ) {
            client.conn.send({ type: ServerMessageType.SLOW_DOWN })
          }
        }

        // Discard client messages for frames older than the server simulation.
        // This will happen if one client is lagging significantly behind the
        // fastest client. Discarded client messages means that the client will
        // almost certainly encounter misprediction.
        if (msg.frame < this.simulationFrame) {
          continue
        }

        // index is an offset from this.simulationFrame
        const index = msg.frame - this.simulationFrame

        // Ensure there is a container the message's frame
        for (let i = this.clientMessagesByFrame.length; i <= index; i++) {
          this.clientMessagesByFrame.push([])
        }

        // Store message grouped by frame, but don't worry about FRAME_END
        // messages.
        if (msg.type !== ClientMessageType.FRAME_END) {
          this.clientMessagesByFrame[index].push(msg)
        }
      }
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

          this.clients.forEach((client, index) => {
            client.conn.send({
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
          if (this.clients.length === this.playerCount) {
            this.setState(GameState.Running)
          }
        }
        break

      case GameState.Running:
        {
          // Because the server ignores client messages for frames that occur
          // before the server's frame, the server needs to run some number of
          // frames behind the clients. This ensures that clients have a grace
          // period to send inputs to the server. The current grace period is to
          // run the server simulation a fixed number of frames behind the
          // fastest client.
          if (
            this.maxReceivedClientFrame - this.simulationFrame <
            this.minFramesBehindClient
          ) {
            break
          }

          // Remove this frame's client messages from the history, then process.
          const frameMessages = this.clientMessagesByFrame.shift() || []
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
          this.clients.forEach((client) => {
            client.conn.send({
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
