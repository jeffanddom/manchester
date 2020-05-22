import { IEntity, TILE_SIZE } from './common'
import { vec2 } from 'gl-matrix'
import { radialTranslate2 } from './mathutil'

const PLAYER_SPEED = TILE_SIZE / 16

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

export class PlayerMover {
  update(entity: IEntity) {
    if (entity.game.keyboard.downKeys.has(keyMap.up)) {
      radialTranslate2(
        entity.transform.position,
        entity.transform.position,
        entity.transform.orientation,
        PLAYER_SPEED,
      )
    }
    if (entity.game.keyboard.downKeys.has(keyMap.right)) {
      entity.transform.orientation += 0.1
    }
    if (entity.game.keyboard.downKeys.has(keyMap.left)) {
      entity.transform.orientation -= 0.1
    }
  }
}
