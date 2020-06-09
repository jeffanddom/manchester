import { TILE_SIZE } from '~/constants'
import { IEntity } from '~/entities/interfaces'
import { IGame } from '~/interfaces'
import { lerp, radialTranslate2 } from '~/util/math'

const PLAYER_SPEED = 60 * (TILE_SIZE / 8)
const PLAYER_ROT_SPEED = 1.5 * Math.PI // 1.5 rotations per second

const keyMap = {
  up: 38, // UP
  // down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
  moveUp: 87,
  moveDown: 83,
  moveLeft: 68,
  moveRight: 65,
}

export class Mover {
  update(entity: IEntity, game: IGame, dt: number) {
    // Turn controls
    // if (game.keyboard.downKeys.has(keyMap.up)) {
    //   radialTranslate2(
    //     entity.transform!.position,
    //     entity.transform!.position,
    //     entity.transform!.orientation,
    //     PLAYER_SPEED * dt,
    //   )
    // }

    // if (game.keyboard.downKeys.has(keyMap.left)) {
    //   entity.transform!.orientation += PLAYER_ROT_SPEED * dt
    // }
    // if (game.keyboard.downKeys.has(keyMap.right)) {
    //   entity.transform!.orientation -= PLAYER_ROT_SPEED * dt
    // }

    // Direction controls
    let angle

    if (game.keyboard.downKeys.has(keyMap.moveUp)) {
      if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
        angle = Math.PI / 4
      } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
        angle = -Math.PI / 4
      } else {
        angle = 0
      }
    } else if (game.keyboard.downKeys.has(keyMap.moveDown)) {
      if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
        angle = Math.PI - Math.PI / 4
      } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
        angle = Math.PI + Math.PI / 4
      } else {
        angle = Math.PI
      }
    } else if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
      angle = Math.PI / 2
    } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
      angle = -Math.PI / 2
    }

    if (angle !== undefined) {
      // FIXME: model off of the turret turning behavior
      entity.transform!.orientation = lerp(
        entity.transform!.orientation,
        angle,
        PLAYER_ROT_SPEED * dt,
      )

      radialTranslate2(
        entity.transform!.position,
        entity.transform!.position,
        angle,
        PLAYER_SPEED * dt,
      )
    }
  }
}
