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
    simState.entityManager.checkpoint(id)

    const transform = simState.entityManager.transforms.get(id)!
    transform.orientation = rotateUntil({
      from: transform.orientation,
      to: message.direction,
      amount: TANK_ROT_SPEED * dt,
    })
    radialTranslate2(
      transform.position,
      transform.position,
      message.direction,
      TANK_SPEED * dt,
    )
  })
}
