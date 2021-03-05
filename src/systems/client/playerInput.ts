import { vec2 } from 'gl-matrix'
import { mat4 } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'

import { ClientSim } from '~/client/ClientSim'
import { CLIENT_INPUT_DELAY } from '~/constants'
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
  dash: 'Space',
}

export enum CursorMode {
  NONE,
  MOVE_BUILDER,
  HARVEST,
  BUILD_TURRET,
  BUILD_WALL,
}

export const update = (client: ClientSim, frame: number): void => {
  handleMoveInput(client, frame)
  handleAttackInput(client, frame)
}

const handleMoveInput = (client: ClientSim, frame: number): void => {
  let direction
  if (client.keyboard.heldkeys.has(keyMap.moveUp)) {
    if (client.keyboard.heldkeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.NW
    } else if (client.keyboard.heldkeys.has(keyMap.moveRight)) {
      direction = DirectionMove.NE
    } else {
      direction = DirectionMove.N
    }
  } else if (client.keyboard.heldkeys.has(keyMap.moveDown)) {
    if (client.keyboard.heldkeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.SW
    } else if (client.keyboard.heldkeys.has(keyMap.moveRight)) {
      direction = DirectionMove.SE
    } else {
      direction = DirectionMove.S
    }
  } else if (client.keyboard.heldkeys.has(keyMap.moveLeft)) {
    direction = DirectionMove.W
  } else if (client.keyboard.heldkeys.has(keyMap.moveRight)) {
    direction = DirectionMove.E
  }

  if (direction !== undefined && client.playerNumber !== undefined) {
    client.sendClientMessage({
      frame: frame + CLIENT_INPUT_DELAY,
      playerNumber: client.playerNumber,
      type: ClientMessageType.PLAYER_MOVE,
      direction,
      dash: client.keyboard.downKeys.has(keyMap.dash),
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
      frame: frame + CLIENT_INPUT_DELAY,
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
