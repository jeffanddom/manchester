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
  clientConnections: IClientConnection[]
  playerCount: number
  minFramesBehindClient: number
  simulationFrame: number
  maxReceivedClientFrame: number
  idleCounter: number // number of frames the server has idled to ensure minFramesBehindClient buffer

  // Common game state
  state: GameState
  nextState: GameState | null

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor(config: { playerCount: number; minFramesBehindClient: number }) {
    this.clientMessagesByFrame = []
    this.entityManager = new EntityManager()
    this.clientConnections = []
    this.playerCount = config.playerCount
    this.minFramesBehindClient = config.minFramesBehindClient
    this.simulationFrame = 0
    this.maxReceivedClientFrame = -1
    this.idleCounter = 0

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
      for (const msg of conn.consume()) {
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

        if (msg.type === ClientMessageType.FRAME_END) {
          // Set a high-water mark for the fastest client.
          this.maxReceivedClientFrame = Math.max(
            this.maxReceivedClientFrame,
            msg.frame,
          )
        } else {
          // Don't bother storing FRAME_END messages.
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
            if (this.idleCounter === 0) {
              console.log(
                `server: idling at frame ${this.simulationFrame}; fastest client at frame ${this.maxReceivedClientFrame}`,
              )
            }

            this.idleCounter++
            break
          } else if (this.idleCounter > 0) {
            console.log(
              `server: resuming simulation at frame ${this.simulationFrame} after ${this.idleCounter} frames of idle`,
            )
            this.idleCounter = 0
          }

          // Remove this frame's client messages from the history, then process.
          const frameMessages = this.clientMessagesByFrame.shift() || []
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
