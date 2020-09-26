import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/interfaces'

export enum ClientMessageType {
  MOVE_PLAYER,
  TANK_SHOOT,
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

export type ClientMessage = MovePlayerClientMessage | TankShootClientMessage
