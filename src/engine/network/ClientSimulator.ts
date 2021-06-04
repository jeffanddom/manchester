import { RollbackableDb } from '../state/StateDbBase'

import { ServerMessage, ServerMessageType } from './ServerMessage'
import { SimulationPhase } from './SimulationPhase'

import { discardUntil } from '~/util/array'
import { RunningAverage } from '~/util/RunningAverage'

interface ServerFrameUpdate {
  frame: number
  inputs: BaseClientMessage[]
}

export type BaseClientMessage = {
  frame: number
  playerNumber: number
}

export class ClientSimulator<TFrameEvent> {
  private maxPredictedFrames: number
  private onAllClientsReady: (playerNumber: number) => void
  private simulate: (
    dt: number,
    frame: number,
    messages: BaseClientMessage[],
    phase: SimulationPhase,
  ) => TFrameEvent[]

  private uncommittedMessageHistory: BaseClientMessage[]
  private serverFrameUpdates: ServerFrameUpdate[]

  private simulationFrame: number
  private committedFrame: number

  private allClientsReady: boolean
  private waitingForServer: boolean

  private serverUpdateFrameDurationAvg: number
  private serverSimulationDurationAvg: number
  private framesAheadOfServer: RunningAverage

  public constructor(config: {
    maxPredictedFrames: number
    onAllClientsReady: (playerNumber: number) => void
    simulate: (
      dt: number,
      frame: number,
      messages: BaseClientMessage[],
      phase: SimulationPhase,
    ) => TFrameEvent[]
  }) {
    this.maxPredictedFrames = config.maxPredictedFrames
    this.onAllClientsReady = config.onAllClientsReady
    this.simulate = config.simulate

    this.uncommittedMessageHistory = []
    this.serverFrameUpdates = []

    this.committedFrame = -1
    this.simulationFrame = 0

    this.allClientsReady = false
    this.waitingForServer = false

    this.serverUpdateFrameDurationAvg = 0
    this.serverSimulationDurationAvg = 0
    this.framesAheadOfServer = new RunningAverage(3 * 60)
  }

  public addClientMessage(message: BaseClientMessage): void {
    this.uncommittedMessageHistory.push(message)
  }

  public tick(params: {
    dt: number
    stateDb: RollbackableDb
    serverMessages: ServerMessage<BaseClientMessage>[]
  }): Map<number, TFrameEvent[]> {
    const eventsByFrame = new Map()

    if (!this.allClientsReady) {
      for (const msg of params.serverMessages) {
        if (msg.type === ServerMessageType.START_GAME) {
          this.allClientsReady = true
          this.onAllClientsReady(msg.playerNumber)
        }
      }

      if (!this.allClientsReady) {
        return eventsByFrame
      }
    }

    // push frame updates from server into list
    for (const msg of params.serverMessages) {
      switch (msg.type) {
        case ServerMessageType.FRAME_UPDATE:
          this.serverFrameUpdates.push({
            frame: msg.frame,
            inputs: msg.inputs,
          })
          this.serverFrameUpdates.sort((a, b) => a.frame - b.frame)

          this.serverUpdateFrameDurationAvg = msg.updateFrameDurationAvg
          this.serverSimulationDurationAvg = msg.simulationDurationAvg
          break

        case ServerMessageType.REMOTE_CLIENT_MESSAGE:
          this.uncommittedMessageHistory.push(msg.message)
          break
      }
    }

    // Early-out if we've simulated too far ahead of the server.
    this.waitingForServer =
      this.serverFrameUpdates.length === 0 &&
      this.simulationFrame - this.committedFrame >= this.maxPredictedFrames
    if (this.waitingForServer) {
      return eventsByFrame
    }

    // Filter out frame updates that we've already committed to game state.
    this.serverFrameUpdates = discardUntil(
      this.serverFrameUpdates,
      (u) => u.frame > this.committedFrame,
    )

    // Next, we process all server updates that we haven't handled already,
    // up to the latest local frame we've predicted.
    this.syncServerState(params.dt, params.stateDb, eventsByFrame)
    this.framesAheadOfServer.sample(this.simulationFrame - this.committedFrame)

    // Run prediction for the current local frame.
    const events = this.simulate(
      params.dt,
      this.simulationFrame,
      this.uncommittedMessageHistory.filter(
        (m) => m.frame === this.simulationFrame,
      ),
      SimulationPhase.ClientPrediction,
    )
    eventsByFrame.set(this.simulationFrame, events)

    this.simulationFrame++

    return eventsByFrame
  }

  public getAllClientsReady(): boolean {
    return this.allClientsReady
  }

  public getWaitingForServer(): boolean {
    return this.waitingForServer
  }

  public getDiagnostics(): {
    serverUpdateFrameDurationAvg: number
    serverSimulationDurationAvg: number
    framesAheadOfServer: number
  } {
    return {
      serverUpdateFrameDurationAvg: this.serverUpdateFrameDurationAvg,
      serverSimulationDurationAvg: this.serverSimulationDurationAvg,
      framesAheadOfServer: this.framesAheadOfServer.average(),
    }
  }

  private syncServerState(
    dt: number,
    stateDb: RollbackableDb,
    eventsByFrame: Map<number, TFrameEvent[]>,
  ): void {
    // Collect all server frames that precede the next frame we need to predict.
    let splitAt = 0
    while (splitAt < this.serverFrameUpdates.length) {
      if (this.serverFrameUpdates[splitAt].frame >= this.simulationFrame) {
        break
      }
      splitAt++
    }

    const toProcess = this.serverFrameUpdates.slice(0, splitAt)
    this.serverFrameUpdates = this.serverFrameUpdates.slice(splitAt)

    // Early-out if there are no server updates we can process right now.
    if (toProcess.length === 0) {
      return
    }

    stateDb.undoPrediction()

    for (const update of toProcess) {
      const events = this.simulate(
        dt,
        update.frame,
        update.inputs,
        SimulationPhase.ClientAuthoritative,
      )
      eventsByFrame.set(update.frame, events)
      this.committedFrame = update.frame
    }

    stateDb.commitPrediction()

    // Discard prediction hints that are older than the latest server frame we
    // committed to state.
    this.uncommittedMessageHistory = this.uncommittedMessageHistory.filter(
      (m) => m.frame > this.committedFrame,
    )

    // Repredict already-simulated frames
    for (let f = this.committedFrame + 1; f < this.simulationFrame; f++) {
      const events = this.simulate(
        dt,
        f,
        this.uncommittedMessageHistory.filter((m) => m.frame === f),
        SimulationPhase.ClientReprediction,
      )
      eventsByFrame.set(f, events)
    }
  }
}
