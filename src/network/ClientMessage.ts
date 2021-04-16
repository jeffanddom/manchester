import { vec2 } from 'gl-matrix'

import { DirectionMove } from '~/input/interfaces'

export type ClientMoveUpdate = {
  direction: DirectionMove
  dash: boolean
}

export type ClientAttackUpdate = {
  targetPos: vec2
  firing: boolean
}

export type ClientMessage = {
  frame: number
  playerNumber: number
  move?: ClientMoveUpdate
  attack?: ClientAttackUpdate
  changeWeapon: boolean
}
