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

export type ServerFrameUpdateMessage<TClientMessage> = {
  type: ServerMessageType.FRAME_UPDATE
  frame: number
  inputs: TClientMessage[]
  updateFrameDurationAvg: number
  simulationDurationAvg: number
}

export type RemoteClientMessage<TClientMessage> = {
  type: ServerMessageType.REMOTE_CLIENT_MESSAGE
  message: TClientMessage
}

export type ServerMessage<TClientMessage> =
  | ServerStartGameMessage
  | ServerFrameUpdateMessage<TClientMessage>
  | RemoteClientMessage<TClientMessage>
