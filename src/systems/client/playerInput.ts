import { vec2 } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'
import { mat4 } from 'gl-matrix'

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
  if (mousePos === undefined) {
    return
  }

  // Translate mouse position to world position
  const mouseWorldPos = vec3.transformMat4(
    vec3.create(),
    client.renderer3d.screenToView(mousePos),
    mat4.invert(mat4.create(), client.camera.getWvTransform()),
  )

  // Get camera ray in world space
  const cameraWorldPos = client.camera.getPos()
  const [dx, dy, dz] = vec3.sub(vec3.create(), mouseWorldPos, cameraWorldPos)

  // Extrapolate ray to the xz-plane
  const targetPos = vec2.fromValues(
    cameraWorldPos[0] - (cameraWorldPos[1] * dx) / dy,
    cameraWorldPos[2] - (cameraWorldPos[1] * dz) / dy,
  )

  client.sendClientMessage({
    frame,
    playerNumber: client.playerNumber,
    type: ClientMessageType.TANK_AIM,
    targetPos,
    firing: client.mouse.isDown(MouseButton.LEFT),
  })

  client.debugDraw3d(() => {
    const halfSize = 0.5

    const minX = targetPos[0] - halfSize
    const maxX = targetPos[0] + halfSize
    const minY = 0.01
    const maxY = minY + halfSize * 2
    const minZ = targetPos[1] - halfSize
    const maxZ = targetPos[1] + halfSize

    const lowNW = [minX, minY, minZ]
    const lowNE = [maxX, minY, minZ]
    const lowSW = [minX, minY, maxZ]
    const lowSE = [maxX, minY, maxZ]
    const highNW = [minX, maxY, minZ]
    const highNE = [maxX, maxY, minZ]
    const highSW = [minX, maxY, maxZ]
    const highSE = [maxX, maxY, maxZ]

    return [
      {
        // prettier-ignore
        points: new Float32Array([
          ...lowNW, ...lowNE,
          ...lowNE, ...lowSE,
          ...lowSE, ...lowSW,
          ...lowSW, ...lowNW,

          ...highNW, ...highNE,
          ...highNE, ...highSE,
          ...highSE, ...highSW,
          ...highSW, ...highNW,          

          ...lowNE, ...highNE,
          ...lowNW, ...highNW,
          ...lowSE, ...highSE,
          ...lowSW, ...highSW,
        ]),
        color: vec4.fromValues(1, 1, 0, 1),
      },
    ]
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
