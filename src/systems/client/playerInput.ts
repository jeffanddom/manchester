import { Client } from '~/Client'
import { DirectionMove } from '~/input/interfaces'
import { MouseButton } from '~/input/interfaces'
import { ClientMessageType } from '~/network/ClientMessage'

export const keyMap = {
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

export const update = (client: Client, frame: number): void => {
  // handleCursorMode(game)
  handleMoveInput(client, frame)
  handleAttackInput(client, frame)
  // handleBuilderInput(game, entityManager)
}

// const handleCursorMode = (game: Game): void => {
//   if (game.client.keyboard.downKeys.has(keyMap.harvestMode)) {
//     game.client.playerInputState.cursorMode = CursorMode.HARVEST
//   } else if (game.client.keyboard.downKeys.has(keyMap.buildTurretMode)) {
//     game.client.playerInputState.cursorMode = CursorMode.BUILD_TURRET
//   } else if (game.client.keyboard.downKeys.has(keyMap.buildWallMode)) {
//     game.client.playerInputState.cursorMode = CursorMode.BUILD_WALL
//   } else if (game.client.keyboard.downKeys.has(keyMap.moveBuilderMode)) {
//     game.client.playerInputState.cursorMode = CursorMode.MOVE_BUILDER
//   } else {
//     game.client.playerInputState.cursorMode = CursorMode.NONE
//   }
// }

const handleMoveInput = (client: Client, frame: number): void => {
  let direction
  if (client.keyboard.downKeys.has(keyMap.moveUp)) {
    if (client.keyboard.downKeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.NW
    } else if (client.keyboard.downKeys.has(keyMap.moveRight)) {
      direction = DirectionMove.NE
    } else {
      direction = DirectionMove.N
    }
  } else if (client.keyboard.downKeys.has(keyMap.moveDown)) {
    if (client.keyboard.downKeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.SW
    } else if (client.keyboard.downKeys.has(keyMap.moveRight)) {
      direction = DirectionMove.SE
    } else {
      direction = DirectionMove.S
    }
  } else if (client.keyboard.downKeys.has(keyMap.moveLeft)) {
    direction = DirectionMove.W
  } else if (client.keyboard.downKeys.has(keyMap.moveRight)) {
    direction = DirectionMove.E
  }

  if (direction !== undefined) {
    client.sendClientMessage({
      frame,
      playerNumber: client.playerNumber,
      type: ClientMessageType.MOVE_PLAYER,
      direction,
    })
  }
}

const handleAttackInput = (client: Client, frame: number): void => {
  const mousePos = client.mouse.getPos()
  if (!mousePos) {
    return
  }

  client.sendClientMessage({
    frame,
    playerNumber: client.playerNumber,
    type: ClientMessageType.TANK_AIM,
    targetPos: client.camera2d.viewToWorldspace(mousePos),
    firing: client.mouse.isDown(MouseButton.LEFT),
  })
}

// const handleBuilderInput = (game: Game, entityManager: EntityManager): void => {
//   const player = entityManager.getPlayer()!
//   player.builderCreator!.nextBuilder = null

//   const mousePos = game.client.mouse.getPos()
//   if (
//     !game.client.mouse.isUp(MouseButton.RIGHT) ||
//     !mousePos ||
//     game.client.playerInputState.cursorMode === CursorMode.NONE
//   ) {
//     return
//   }

//   const inventory = player.inventory!
//   let mode
//   switch (game.client.playerInputState.cursorMode) {
//     case CursorMode.HARVEST:
//       mode = BuilderMode.HARVEST
//       break
//     case CursorMode.BUILD_TURRET:
//       if (!inventory.includes(PickupType.Core)) {
//         return
//       }

//       inventory.splice(inventory.indexOf(PickupType.Core), 1)
//       mode = BuilderMode.BUILD_TURRET
//       break
//     case CursorMode.BUILD_WALL:
//       if (!inventory.includes(PickupType.Wood)) {
//         return
//       }

//       inventory.splice(inventory.indexOf(PickupType.Wood), 1)
//       mode = BuilderMode.BUILD_WALL
//       break
//     case CursorMode.MOVE_BUILDER:
//       mode = BuilderMode.MOVE
//       break
//   }

//   player.builderCreator!.nextBuilder = {
//     mode,
//     dest: game.client.camera.viewToWorldspace(mousePos),
//   }
// }
