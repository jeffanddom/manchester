import { ClientMessageType } from '~/ClientMessage'
import { Game } from '~/Game'
import { DirectionMove } from '~/interfaces'
import { MouseButton } from '~/Mouse'
import { BuilderMode } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'

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

export enum CursorMode {
  NONE,
  MOVE_BUILDER,
  HARVEST,
  BUILD_TURRET,
  BUILD_WALL,
}

export const update = (game: Game, frame: number): void => {
  // handleCursorMode(game)
  handleMoveInput(game, frame)
  // handleAttackInput(game)
  // handleBuilderInput(game)
}

const handleCursorMode = (game: Game): void => {
  if (game.keyboard.downKeys.has(keyMap.harvestMode)) {
    game.playerInputState.cursorMode = CursorMode.HARVEST
  } else if (game.keyboard.downKeys.has(keyMap.buildTurretMode)) {
    game.playerInputState.cursorMode = CursorMode.BUILD_TURRET
  } else if (game.keyboard.downKeys.has(keyMap.buildWallMode)) {
    game.playerInputState.cursorMode = CursorMode.BUILD_WALL
  } else if (game.keyboard.downKeys.has(keyMap.moveBuilderMode)) {
    game.playerInputState.cursorMode = CursorMode.MOVE_BUILDER
  } else {
    game.playerInputState.cursorMode = CursorMode.NONE
  }
}

const handleMoveInput = (game: Game, frame: number): void => {
  let direction
  if (game.keyboard.downKeys.has(keyMap.moveUp)) {
    if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.NW
    } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
      direction = DirectionMove.NE
    } else {
      direction = DirectionMove.N
    }
  } else if (game.keyboard.downKeys.has(keyMap.moveDown)) {
    if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.SW
    } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
      direction = DirectionMove.SE
    } else {
      direction = DirectionMove.S
    }
  } else if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
    direction = DirectionMove.W
  } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
    direction = DirectionMove.E
  }

  if (direction !== undefined) {
    game.sendClientMessage({
      frame,
      type: ClientMessageType.MOVE_PLAYER,
      direction,
    })
  }
}

const handleAttackInput = (game: Game): void => {
  let targetPos = null
  const mousePos = game.mouse.getPos()
  if (mousePos) {
    targetPos = game.camera.viewToWorldspace(mousePos)
  }

  game.player!.shooter!.input = {
    target: targetPos,
    fire: game.mouse.isDown(MouseButton.LEFT),
  }
}

const handleBuilderInput = (game: Game): void => {
  game.player!.builderCreator!.nextBuilder = null

  const mousePos = game.mouse.getPos()
  if (
    !game.mouse.isUp(MouseButton.RIGHT) ||
    !mousePos ||
    game.playerInputState.cursorMode === CursorMode.NONE
  ) {
    return
  }

  const inventory = game.player!.inventory!
  let mode
  switch (game.playerInputState.cursorMode) {
    case CursorMode.HARVEST:
      mode = BuilderMode.HARVEST
      break
    case CursorMode.BUILD_TURRET:
      if (!inventory.includes(PickupType.Core)) {
        return
      }

      inventory.splice(inventory.indexOf(PickupType.Core), 1)
      mode = BuilderMode.BUILD_TURRET
      break
    case CursorMode.BUILD_WALL:
      if (!inventory.includes(PickupType.Wood)) {
        return
      }

      inventory.splice(inventory.indexOf(PickupType.Wood), 1)
      mode = BuilderMode.BUILD_WALL
      break
    case CursorMode.MOVE_BUILDER:
      mode = BuilderMode.MOVE
      break
  }

  game.player!.builderCreator!.nextBuilder = {
    mode,
    dest: game.camera.viewToWorldspace(mousePos),
  }
}
