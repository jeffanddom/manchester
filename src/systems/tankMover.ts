import { mat4, vec2, vec3 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { DirectionMove } from '~/input/interfaces'
import {
  ClientMessage,
  ClientMessageType,
  PlayerMoveClientMessage,
} from '~/network/ClientMessage'
import { radialTranslate2, rotateUntil } from '~/util/math'

const TANK_SPEED = 60 * (TILE_SIZE / 8)
const TANK_ROT_SPEED = Math.PI
const DASH_DURATION = 6
const DASH_SPEED = 60 * (TILE_SIZE / 1.25)
const DASH_COOLDOWN = 25

export type TankMoverComponent = {
  dashDirection: DirectionMove
  lastDashFrame?: number
}

export function make(): TankMoverComponent {
  return {
    dashDirection: DirectionMove.N,
  }
}

export function clone(t: TankMoverComponent): TankMoverComponent {
  return {
    dashDirection: t.dashDirection,
    lastDashFrame: t.lastDashFrame,
  }
}

export const update = (
  simState: {
    entityManager: EntityManager
    messages: ClientMessage[]
    frame: number
  },
  dt: number,
): void => {
  const messages = new Map<number, PlayerMoveClientMessage>()
  simState.messages.forEach((m) => {
    if (m.type === ClientMessageType.PLAYER_MOVE) {
      messages.set(m.playerNumber, m)
    }
  })

  for (const [id, tankMover] of simState.entityManager.tankMovers) {
    const playerNumber = simState.entityManager.playerNumbers.get(id)!
    const transform = simState.entityManager.transforms.get(id)!

    const message = messages.get(playerNumber)

    if (tankMover.lastDashFrame !== undefined) {
      if (simState.frame - tankMover.lastDashFrame < DASH_DURATION) {
        const position = radialTranslate2(
          vec2.create(),
          transform.position,
          tankMover.dashDirection,
          DASH_SPEED * dt,
        )

        simState.entityManager.transforms.update(id, { position })
        continue
      }

      if (simState.frame - tankMover.lastDashFrame >= DASH_COOLDOWN) {
        simState.entityManager.tankMovers.update(id, {
          lastDashFrame: undefined,
        })
      }
    }

    if (message !== undefined) {
      let orientation
      if (message.dash && tankMover.lastDashFrame === undefined) {
        simState.entityManager.tankMovers.update(id, {
          lastDashFrame: simState.frame,
          dashDirection: message.direction,
        })
        orientation = message.direction
        simState.entityManager.transforms.update(id, { orientation })
      } else {
        orientation = rotateUntil({
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
      }

      simState.entityManager.entityModels.update(id, {
        modifiers: {
          'shiba:post': mat4.fromRotation(
            mat4.create(),

            // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
            -orientation,
            vec3.fromValues(0, 1, 0),
          ),
        },
      })
    }
  }
}
