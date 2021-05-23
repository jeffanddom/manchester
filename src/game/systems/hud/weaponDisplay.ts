import { vec2 } from 'gl-matrix'

import { WeaponType } from '../WeaponType'

import {
  Primitive2d,
  Renderable2d,
  TextAlign,
} from '~/engine/renderer/Renderer2d'
import { StateDb } from '~/game/state/StateDb'

export const update = (
  stateDb: StateDb,
  playerNumber: number,
): Renderable2d[] => {
  const playerId = stateDb.getPlayerId(playerNumber)
  if (playerId === undefined) {
    return []
  }

  const shooter = stateDb.shooters.get(playerId)!
  shooter.weaponType

  return [
    {
      primitive: Primitive2d.TEXT,
      text: WeaponType[shooter.weaponType].toUpperCase(),
      pos: vec2.fromValues(40, 15),
      hAlign: TextAlign.Min,
      vAlign: TextAlign.Min,
      font: '20px Impact',
      style: 'white',
    },
  ]
}
