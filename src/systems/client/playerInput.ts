import { vec2 } from 'gl-matrix'
import { mat4 } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'

import { ClientSim } from '~/client/ClientSim'
import { DirectionMove } from '~/input/interfaces'
import { MouseButton } from '~/input/interfaces'
import { ClientMessageType } from '~/network/ClientMessage'
import { UnlitObjectType } from '~/renderer/Renderer3d'

export const keyMap = {
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  harvestMode: 'Digit1',
  buildTurretMode: 'Digit2',
  buildWallMode: 'Digit3',
  moveBuilderMode: 'Digit4',
}

export enum CursorMode {
  NONE,
  MOVE_BUILDER,
  HARVEST,
  BUILD_TURRET,
  BUILD_WALL,
}

export const update = (client: ClientSim, frame: number): void => {
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

const handleMoveInput = (client: ClientSim, frame: number): void => {
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

  if (direction !== undefined && client.playerNumber !== undefined) {
    client.sendClientMessage({
      frame,
      playerNumber: client.playerNumber,
      type: ClientMessageType.MOVE_PLAYER,
      direction,
    })
  }
}

const handleAttackInput = (client: ClientSim, frame: number): void => {
  const mousePos = client.mouse.getPos()
  if (mousePos === undefined) {
    return
  }

  // Get mouse position on display plane, in worldspace coordinates
  const mouseWorldPos = client.camera.screenToWorld(vec3.create(), mousePos)

  // Get camera ray in world space
  const cameraWorldPos = client.camera.getPos()
  const [dx, dy, dz] = vec3.sub(vec3.create(), mouseWorldPos, cameraWorldPos)

  // Extrapolate ray to the xz-plane
  const targetPos = vec2.fromValues(
    cameraWorldPos[0] - (cameraWorldPos[1] * dx) / dy,
    cameraWorldPos[2] - (cameraWorldPos[1] * dz) / dy,
  )

  if (client.playerNumber !== undefined) {
    client.sendClientMessage({
      frame,
      playerNumber: client.playerNumber,
      type: ClientMessageType.TANK_AIM,
      targetPos,
      firing: client.mouse.isDown(MouseButton.LEFT),
    })

    const playerId = client.entityManager.getPlayerId(client.playerNumber)
    if (playerId !== undefined) {
      const playerPos = client.entityManager.transforms.get(playerId)!.position
      client.debugDraw.draw3d(() => [
        {
          object: {
            type: UnlitObjectType.Lines,
            // prettier-ignore
            positions: new Float32Array([
              playerPos[0], 0, playerPos[1],
              targetPos[0], 0, targetPos[1],
            ]),
            color: vec4.fromValues(1, 0, 0, 1),
          },
        },
      ])
    }
  }

  client.debugDraw.draw3d(() => [
    {
      object: {
        type: UnlitObjectType.Model,
        modelName: 'linecube',
        model2World: mat4.fromTranslation(
          mat4.create(),
          vec3.fromValues(targetPos[0], 0.5, targetPos[1]),
        ),
        color: vec4.fromValues(1, 1, 0, 1),
      },
    },
  ])
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
