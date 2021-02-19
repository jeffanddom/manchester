import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/input/interfaces'

export enum ClientMessageType {
  // Informs the server about the end of a client frame. Sent every frame from
  // client to server.
  FRAME_END,
  PLAYER_MOVE,
  TANK_AIM,
}

export type ClientMessageFrameEnd = {
  type: ClientMessageType.FRAME_END
  frame: number
}

export type PlayerMoveClientMessage = {
  frame: number
  playerNumber: number
  type: ClientMessageType.PLAYER_MOVE
  direction: DirectionMove
  dash: boolean
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
  | PlayerMoveClientMessage
  | TankAimClientMessage
