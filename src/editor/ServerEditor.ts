import { StateDb } from '~/editor/state/StateDb'
import { initSystems, updateSystems } from '~/editor/updateSystems'
import { mockDebugDraw } from '~/engine/DebugDraw'
import { IClientConnection } from '~/engine/network/ClientConnection'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { ServerSimulator } from '~/engine/network/ServerSimulator'
import { SimulationPhase } from '~/engine/network/SimulationPhase'

export class ServerEditor {
  private stateDb: StateDb

  private clients: {
    frame: number
    conn: IClientConnection
  }[]
  private playerCount: number

  private simulator: ServerSimulator

  private shuttingDown: boolean

  public constructor(config: { playerCount: number }) {
    this.stateDb = new StateDb()
    this.clients = []
    this.playerCount = config.playerCount
    this.simulator = new ServerSimulator({
      playerCount: config.playerCount,
      onAllClientsReady: () => this.onAllClientsReady(),
      simulate: (dt, frame, messages, phase) =>
        this.simulate(dt, frame, messages, phase),
    })

    this.shuttingDown = false
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
    initSystems(this.stateDb)
  }

  private simulate(
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ): void {
    updateSystems(
      {
        stateDb: this.stateDb,
        messages: messages,
        frame: frame,
        debugDraw: mockDebugDraw,
        phase,
      },
      dt,
    )
  }
}
