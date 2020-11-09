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
    const mutableTransform = simState.entityManager.transforms.checkpoint(id)!

    mutableTransform.orientation = rotateUntil({
      from: mutableTransform.orientation,
      to: message.direction,
      amount: TANK_ROT_SPEED * dt,
    })
    radialTranslate2(
      mutableTransform.position,
      mutableTransform.position,
      message.direction,
      TANK_SPEED * dt,
    )
  })
}
