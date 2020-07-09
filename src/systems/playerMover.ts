import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { radialTranslate2 } from '~/util/math'
import { rotate } from '~/util/rotator'

const PLAYER_SPEED = 60 * (TILE_SIZE / 8)
const PLAYER_ROT_SPEED = Math.PI

const keyMap = {
  moveUp: 87,
  moveDown: 83,
  moveLeft: 68,
  moveRight: 65,
}

export const update = (game: Game, dt: number): void => {
  const transform = game.player.unwrap().transform!

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
    transform.orientation = rotate({
      from: transform.orientation,
      to: angle,
      amount: PLAYER_ROT_SPEED * dt,
    })

    radialTranslate2(
      transform.position,
      transform.position,
      angle,
      PLAYER_SPEED * dt,
    )
  }
}
