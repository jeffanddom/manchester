import { IEntity, TILE_SIZE } from './common'
import { vec2 } from 'gl-matrix'

const PLAYER_SPEED = vec2.fromValues(0, -TILE_SIZE / 8)

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

export class PlayerControl {
  update(entity: IEntity) {
    if (entity.game.keyboard.downKeys.has(keyMap.up)) {
      entity.transform.position = vec2.add(
        entity.transform.position,
        entity.transform.position,
        vec2.rotate(
          vec2.create(),
          PLAYER_SPEED,
          [0, 0],
          entity.transform.orientation,
        ),
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
