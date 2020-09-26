import { ClientMessage } from './ClientMessage'

enum ServerMessageType {
  PLAYER_NUMBER,
  FRAME_UPDATE,
}

export type ServerPlayerNumberMessage = {
  type: ServerMessageType.PLAYER_NUMBER
  playerNumber: number
}

export type ServerFrameUpdateMessage = {
  type: ServerMessageType.FRAME_UPDATE
  frame: number
  inputs: ClientMessage[]
}

export type ServerMessage = ServerPlayerNumberMessage | ServerFrameUpdateMessage
