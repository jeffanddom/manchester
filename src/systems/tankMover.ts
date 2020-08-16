import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { DirectionMove } from '~/interfaces'
import { radialTranslate2, rotateUntil } from '~/util/math'

export class TankMoverComponent {
  nextInput: {
    requestedDirection: DirectionMove
  } | null

  constructor() {
    this.nextInput = null
  }
}

const TANK_SPEED = 60 * (TILE_SIZE / 8)
const TANK_ROT_SPEED = Math.PI

export const update = (game: Game, dt: number): void => {
  for (const id in game.entities.entities) {
    const entity = game.entities.entities[id]

    if (!entity.transform || !entity.tankMover || !entity.tankMover.nextInput) {
      continue
    }

    entity.transform.orientation = rotateUntil({
      from: entity.transform.orientation,
      to: entity.tankMover.nextInput.requestedDirection,
      amount: TANK_ROT_SPEED * dt,
    })
    radialTranslate2(
      entity.transform.position,
      entity.transform.position,
      entity.tankMover.nextInput.requestedDirection,
      TANK_SPEED * dt,
    )
  }
}
