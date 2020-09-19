import {
  ClientMessage,
  ClientMessageType,
  MovePlayerClientMessage,
} from '~/ClientMessage'
import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
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
    const player = simState.entityManager.getPlayer(message.playerNumber)
    if (!player) {
      return
    }

    simState.entityManager.checkpointEntity(player.id)

    player.transform!.orientation = rotateUntil({
      from: player.transform!.orientation,
      to: message.direction,
      amount: TANK_ROT_SPEED * dt,
    })
    radialTranslate2(
      player.transform!.position,
      player.transform!.position,
      message.direction,
      TANK_SPEED * dt,
    )
  })
}
