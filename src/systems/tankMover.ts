import { mat4, vec2, vec3 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import {
  ClientMessage,
  ClientMessageType,
  MovePlayerClientMessage,
} from '~/network/ClientMessage'
import { radialTranslate2, rotateUntil } from '~/util/math'

const TANK_SPEED = 60 * (TILE_SIZE / 8)
const TANK_ROT_SPEED = Math.PI

export const update = (
  simState: {
    entityManager: EntityManager
    messages: ClientMessage[]
  },
  dt: number,
): void => {
  const messages: Array<MovePlayerClientMessage> = []
  simState.messages.forEach((m) => {
    if (m.type === ClientMessageType.MOVE_PLAYER) {
      messages.push(m)
    }
  })

  messages.forEach((message) => {
    const id = simState.entityManager.getPlayerId(message.playerNumber)!
    const transform = simState.entityManager.transforms.get(id)!
    const orientation = rotateUntil({
      from: transform.orientation,
      to: message.direction,
      amount: TANK_ROT_SPEED * dt,
    })
    const position = radialTranslate2(
      vec2.create(),
      transform.position,
      message.direction,
      TANK_SPEED * dt,
    )

    simState.entityManager.transforms.update(id, { position, orientation })
    simState.entityManager.entityModels.update(id, {
      modifiers: {
        'tank:post': mat4.fromRotation(
          mat4.create(),

          // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
          -orientation,
          vec3.fromValues(0, 1, 0),
        ),
      },
    })
  })
}
