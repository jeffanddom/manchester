import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { radialTranslate2, rotateUntil } from '~/util/math'

const PLAYER_SPEED = 60 * (TILE_SIZE / 8)
const PLAYER_ROT_SPEED = Math.PI

const keyMap = {
  moveUp: 87, // W
  moveDown: 83, // S
  moveLeft: 68, // A
  moveRight: 65, // D
  harvestMode: 49, // 1
  buildTurretMode: 50, // 2
  buildWallMode: 51, // 3
  moveBuilderMode: 52, // 4
}

export enum RightClickMode {
  NONE,
  MOVE_BUILDER,
  HARVEST,
  BUILD_TURRET,
  BUILD_WALL,
}

export const update = (game: Game, dt: number): void => {
  const transform = game.player!.transform!

  // Right click mode
  if (game.keyboard.downKeys.has(keyMap.harvestMode)) {
    game.playerInputState.rightClickMode = RightClickMode.HARVEST
  } else if (game.keyboard.downKeys.has(keyMap.buildTurretMode)) {
    game.playerInputState.rightClickMode = RightClickMode.BUILD_TURRET
  } else if (game.keyboard.downKeys.has(keyMap.buildWallMode)) {
    game.playerInputState.rightClickMode = RightClickMode.BUILD_WALL
  } else if (game.keyboard.downKeys.has(keyMap.moveBuilderMode)) {
    game.playerInputState.rightClickMode = RightClickMode.MOVE_BUILDER
  } else {
    game.playerInputState.rightClickMode = RightClickMode.NONE
  }

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
    transform.orientation = rotateUntil({
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
