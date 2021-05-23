import { IClientConnection } from '~/engine/network/ClientConnection'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { ServerMessageType } from '~/engine/network/ServerMessage'
import { SimulationPhase } from '~/engine/network/SimulationPhase'
import { StateDbBase } from '~/engine/state/StateDbBase'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export class ServerSimulator {
  private playerCount: number
  private onAllClientsReady: () => void
  private simulate: (
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ) => void

  // A buffer of unprocessed client messages received from clients. The messages
  // are grouped by frame, and the groups are indexed by the number of frames
  // ahead of the server's current frame.
  private clientMessagesByFrame: ClientMessage[][]
  private simulationFrame: number
  private allClientsReady: boolean

  private updateFrameDurations: RunningAverage
  private lastUpdateAt: number
  private simulationDurations: RunningAverage

  public constructor(config: {
    playerCount: number
    onAllClientsReady: () => void
    simulate: (
      dt: number,
      frame: number,
      messages: ClientMessage[],
      phase: SimulationPhase,
    ) => void
  }) {
    this.playerCount = config.playerCount
    this.onAllClientsReady = config.onAllClientsReady
    this.simulate = config.simulate

    this.clientMessagesByFrame = []
    this.simulationFrame = 0
    this.allClientsReady = false

    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.lastUpdateAt = time.current()
    this.simulationDurations = new RunningAverage(3 * 60)
  }

  update(
    dt: number,
    clients: {
      frame: number
      conn: IClientConnection
    }[],
    stateDb: StateDbBase,
  ): void {
    const now = time.current()
    this.updateFrameDurations.sample(now - this.lastUpdateAt)
    this.lastUpdateAt = now

    // process incoming client messages
    for (const client of clients) {
      for (const msg of client.conn.consume()) {
        if (msg.frame > client.frame) {
          client.frame = msg.frame
        }

        // Discard the message if it is no longer possible to simulate; i.e.,
        // the frame it describes has already been simulated.
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
        this.clientMessagesByFrame[index].push(msg)

        for (const receiver of clients) {
          if (client === receiver) {
            continue
          }

          client.conn.send({
            type: ServerMessageType.REMOTE_CLIENT_MESSAGE,
            message: msg,
          })
        }
      }
    }

    if (!this.allClientsReady) {
      if (clients.length !== this.playerCount) {
        return
      }

      this.allClientsReady = true
      this.onAllClientsReady()

      clients.forEach((client, index) => {
        client.conn.send({
          type: ServerMessageType.START_GAME,
          playerNumber: index + 1,
        })
      })
    }

    // Advance only if all clients have already reached the frame the
    // server is about to simulate.
    let doSim = true
    for (const c of clients) {
      if (c.frame < this.simulationFrame) {
        doSim = false
        break
      }
    }

    if (!doSim) {
      return
    }

    const start = time.current()

    // Remove this frame's client messages from the history, then process.
    const frameMessages = this.clientMessagesByFrame.shift() ?? []

    for (const client of clients) {
      client.conn.send({
        type: ServerMessageType.FRAME_UPDATE,
        frame: this.simulationFrame,
        inputs: frameMessages,
        updateFrameDurationAvg: this.updateFrameDurations.average(),
        simulationDurationAvg: this.simulationDurations.average(),
      })
    }

    this.simulate(
      dt,
      this.simulationFrame,
      frameMessages,
      SimulationPhase.ServerTick,
    )

    this.simulationDurations.sample(time.current() - start)
    this.simulationFrame++

    // On the server, there is no reason to accumulate prediction state, because
    // the server simulation is authoritative.
    stateDb.commitPrediction()
  }
}
