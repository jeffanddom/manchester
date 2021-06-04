import { vec3 } from 'gl-matrix'

import { Camera3d } from '~/common/Camera3d'
import { CLIENT_INPUT_DELAY } from '~/common/settings'
import { ClientEditor } from '~/editor/ClientEditor'
import { CursorUpdate } from '~/editor/messages'
import { DirectionMove, IKeyboard, IMouse } from '~/engine/input/interfaces'
import { Zero3 } from '~/util/math'

export const keyMap = {
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  fastScroll: 'ShiftLeft',
}

export const handleInput = (
  editor: ClientEditor,
  frame: number,
  dt: number,
): void => {
  handleMoveInput(editor.keyboard, editor.camera, dt)
  const cursorUpdate = handleMouseInput(editor.mouse, editor.camera)

  editor.sendClientMessage({
    frame: frame + CLIENT_INPUT_DELAY,
    playerNumber: editor.playerNumber!,
    cursor: cursorUpdate,
  })
}

const handleMoveInput = (
  keyboard: IKeyboard,
  camera: Camera3d,
  dt: number,
): void => {
  let direction
  if (keyboard.heldkeys.has(keyMap.moveUp)) {
    if (keyboard.heldkeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.NW
    } else if (keyboard.heldkeys.has(keyMap.moveRight)) {
      direction = DirectionMove.NE
    } else {
      direction = DirectionMove.N
    }
  } else if (keyboard.heldkeys.has(keyMap.moveDown)) {
    if (keyboard.heldkeys.has(keyMap.moveLeft)) {
      direction = DirectionMove.SW
    } else if (keyboard.heldkeys.has(keyMap.moveRight)) {
      direction = DirectionMove.SE
    } else {
      direction = DirectionMove.S
    }
  } else if (keyboard.heldkeys.has(keyMap.moveLeft)) {
    direction = DirectionMove.W
  } else if (keyboard.heldkeys.has(keyMap.moveRight)) {
    direction = DirectionMove.E
  }

  if (direction === undefined) {
    return undefined
  }

  let speed = 3
  if (keyboard.heldkeys.has(keyMap.fastScroll)) {
    speed = 10
  }

  const vel = vec3.fromValues(0, 0, -speed)
  vec3.scale(vel, vel, dt)
  vec3.rotateY(vel, vel, Zero3, -direction)

  const tpos = vec3.create()
  camera.getTarget(tpos)
  vec3.add(tpos, tpos, vel)
  camera.setTarget(tpos)

  const cpos = vec3.create()
  vec3.add(cpos, tpos, [0, 12, 3])
  camera.setPos(cpos)
}

const handleMouseInput = (
  mouse: IMouse,
  camera: Camera3d,
): CursorUpdate | undefined => {
  const mousePos = mouse.getPos()
  if (mousePos === undefined) {
    return undefined
  }

  // Get mouse position on display plane, in worldspace coordinates
  const mouseWorldPos = camera.screenToWorld(vec3.create(), mousePos)

  // Get camera ray in world space
  const cameraWorldPos = camera.getPos()
  const [dx, dy, dz] = vec3.sub(vec3.create(), mouseWorldPos, cameraWorldPos)

  // Extrapolate ray to the xz-plane
  return {
    x: cameraWorldPos[0] - (cameraWorldPos[1] * dx) / dy,
    y: cameraWorldPos[2] - (cameraWorldPos[1] * dz) / dy,
  }
}
