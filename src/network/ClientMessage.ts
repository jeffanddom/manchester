import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/input/interfaces'

export enum ClientMessageType {
  // Informs the server about the end of a client frame. Sent every frame from
  // client to server.
  FRAME_END,
  MOVE_PLAYER,
  TANK_AIM,
}

export type ClientMessageFrameEnd = {
  type: ClientMessageType.FRAME_END
  frame: number
}

export type MovePlayerClientMessage = {
  frame: number
  playerNumber: number
  type: ClientMessageType.MOVE_PLAYER
  direction: DirectionMove
}

export type TankAimClientMessage = {
  frame: number
  playerNumber: number
  type: ClientMessageType.TANK_AIM
  targetPos: vec2
  firing: boolean
}

export type ClientMessage =
  | ClientMessageFrameEnd
  | MovePlayerClientMessage
  | TankAimClientMessage
