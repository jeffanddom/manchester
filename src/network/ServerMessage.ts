import { ClientMessage } from './ClientMessage'

export enum ServerMessageType {
  START_GAME,
  FRAME_UPDATE,
  SPEED_UP,
  SLOW_DOWN,
}

export type ServerStartGameMessage = {
  type: ServerMessageType.START_GAME
  playerNumber: number
}

export type ServerFrameUpdateMessage = {
  type: ServerMessageType.FRAME_UPDATE
  frame: number
  inputs: ClientMessage[]
}

export type ServerSpeedUpMessage = {
  type: ServerMessageType.SPEED_UP
}

export type ServerSlowDownMessage = {
  type: ServerMessageType.SLOW_DOWN
}

export type ServerMessage =
  | ServerStartGameMessage
  | ServerFrameUpdateMessage
  | ServerSpeedUpMessage
  | ServerSlowDownMessage
