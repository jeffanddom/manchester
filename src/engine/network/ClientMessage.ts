import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/engine/input/interfaces'

export type ClientMoveUpdate = {
  direction: DirectionMove
  dash: boolean
}

export type ClientAttackUpdate = {
  targetPos: vec2
  fireHeld: boolean
  fireDown: boolean
}

export type ClientMessage = {
  frame: number
  playerNumber: number
  move?: ClientMoveUpdate
  attack?: ClientAttackUpdate
  changeWeapon: boolean
}
