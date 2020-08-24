import { ClientMessageType } from '~/ClientMessage'
import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { radialTranslate2, rotateUntil } from '~/util/math'

const TANK_SPEED = 60 * (TILE_SIZE / 8)
const TANK_ROT_SPEED = Math.PI

export const update = (game: Game, dt: number, frame: number): void => {
  const message = game.clientMessageQueue.find(
    (m) => m.frame === frame && m.type === ClientMessageType.MOVE_PLAYER,
  )
  if (!message) {
    return
  }

  const player = game.serverEntityManager.getPlayer()
  if (!player) {
    return
  }

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
}
