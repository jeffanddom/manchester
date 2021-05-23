import { vec2 } from 'gl-matrix'

import { mockDebugDraw } from '~/engine/DebugDraw'
import { IClientConnection } from '~/engine/network/ClientConnection'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { ServerSimulator } from '~/engine/network/ServerSimulator'
import { SimulationPhase } from '~/engine/network/SimulationPhase'
import * as terrain from '~/engine/terrain'
import { gameProgression, initMap } from '~/game/common'
import { TILE_SIZE } from '~/game/constants'
import { Map } from '~/game/map/interfaces'
import { simulate } from '~/game/simulate'
import { StateDb } from '~/game/state/StateDb'
import * as aabb2 from '~/util/aabb2'

export class ServerSim {
  private stateDb: StateDb

  private clients: {
    frame: number
    conn: IClientConnection
  }[]
  private playerCount: number

  private simulator: ServerSimulator

  private shuttingDown: boolean

  private currentLevel: number
  private map: Map
  private terrainLayer: terrain.Layer

  public constructor(config: { playerCount: number }) {
    this.stateDb = new StateDb(aabb2.create())
    this.clients = []
    this.playerCount = config.playerCount
    this.simulator = new ServerSimulator({
      playerCount: config.playerCount,
      onAllClientsReady: () => this.onAllClientsReady(),
      simulate: (dt, frame, messages, phase) =>
        this.simulate(dt, frame, messages, phase),
    })

    this.shuttingDown = false

    this.currentLevel = 0
    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      tileSize: TILE_SIZE,
      terrain: this.map.terrain,
    })
  }

  public shutdown(): void {
    this.shuttingDown = true

    // Terminate all client connections
    for (const { conn } of this.clients) {
      conn.close()
    }
  }

  public connectClient(conn: IClientConnection): void {
    if (this.shuttingDown) {
      conn.close()
      return
    }

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

  public update(dt: number): void {
    if (this.shuttingDown) {
      return
    }

    this.simulator.update(dt, this.clients, this.stateDb)
  }

  private onAllClientsReady(): void {
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)
    const dimensions = vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE)

    this.stateDb = new StateDb([
      worldOrigin[0],
      worldOrigin[1],
      worldOrigin[0] + dimensions[0],
      worldOrigin[1] + dimensions[1],
    ])

    this.terrainLayer = initMap(this.stateDb, this.map)
  }

  private simulate(
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ): void {
    simulate(
      {
        stateDb: this.stateDb,
        messages: messages,
        frameEvents: [],
        terrainLayer: this.terrainLayer,
        frame: frame,
        debugDraw: mockDebugDraw,
        phase,
      },
      dt,
    )
  }
}
