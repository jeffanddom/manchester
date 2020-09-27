import { ClientMessage } from './ClientMessage'

export enum ServerMessageType {
  START_GAME,
  FRAME_UPDATE,
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

export type ServerMessage = ServerStartGameMessage | ServerFrameUpdateMessage
