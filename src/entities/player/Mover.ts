import { TILE_SIZE } from '~/constants'
import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import { radialTranslate2 } from '~util/math'

const PLAYER_SPEED = 60 * (TILE_SIZE / 4)
const PLAYER_ROT_SPEED = 1.25 * 2 * Math.PI // 1.5 rotations per second

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

export class Mover {
  update(entity: IEntity, game: IGame, dt: number) {
    if (game.keyboard.downKeys.has(keyMap.up)) {
      radialTranslate2(
        entity.transform.position,
        entity.transform.position,
        entity.transform.orientation,
        PLAYER_SPEED * dt,
      )
    }

    if (game.keyboard.downKeys.has(keyMap.right)) {
      entity.transform.orientation += PLAYER_ROT_SPEED * dt
    }
    if (game.keyboard.downKeys.has(keyMap.left)) {
      entity.transform.orientation -= PLAYER_ROT_SPEED * dt
    }
  }
}
