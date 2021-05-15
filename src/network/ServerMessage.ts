import { ClientMessage } from './ClientMessage'

export enum ServerMessageType {
  START_GAME,
  FRAME_UPDATE,
  SPEED_UP,
  SLOW_DOWN,
  REMOTE_CLIENT_MESSAGE,
}

export type ServerStartGameMessage = {
  type: ServerMessageType.START_GAME
  playerNumber: number
}

export type ServerFrameUpdateMessage = {
  type: ServerMessageType.FRAME_UPDATE
  frame: number
  inputs: ClientMessage[]
  updateFrameDurationAvg: number
  simulationDurationAvg: number
}

export type RemoteClientMessage = {
  type: ServerMessageType.REMOTE_CLIENT_MESSAGE
  message: ClientMessage
}

export type ServerMessage =
  | ServerStartGameMessage
  | ServerFrameUpdateMessage
  | RemoteClientMessage
