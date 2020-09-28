import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/interfaces'

export enum ClientMessageType {
  // Informs the server about the end of a client frame. Sent every frame from
  // client to server.
  FRAME_END,
  MOVE_PLAYER,
  TANK_SHOOT,
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

export type TankShootClientMessage = {
  frame: number
  playerNumber: number
  type: ClientMessageType.TANK_SHOOT
  targetPos: vec2
}

export type ClientMessage =
  | ClientMessageFrameEnd
  | MovePlayerClientMessage
  | TankShootClientMessage
