import { mat4, vec2, vec3 } from 'gl-matrix'

import {
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  EXTERNAL_VELOCITY_DECELERATION,
  TANK_ROT_SPEED,
  TANK_SPEED,
} from '~/constants'
import { EntityManager } from '~/entities/EntityManager'
import { DirectionMove } from '~/input/interfaces'
import { ClientMessage, ClientMoveUpdate } from '~/network/ClientMessage'
import { radialTranslate2, rotateUntil } from '~/util/math'

export type TankMoverComponent = {
  dashDirection: DirectionMove
  lastDashFrame?: number
  externalVelocity: vec2
}

export function make(): TankMoverComponent {
  return {
    dashDirection: DirectionMove.N,
    externalVelocity: vec2.create(),
  }
}

export function clone(t: TankMoverComponent): TankMoverComponent {
  return {
    dashDirection: t.dashDirection,
    lastDashFrame: t.lastDashFrame,
    externalVelocity: vec2.clone(t.externalVelocity),
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
  const messages = new Map<number, ClientMoveUpdate>()
  simState.messages.forEach((m) => {
    if (m.move !== undefined) {
      messages.set(m.playerNumber, m.move)
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

    const position = vec2.clone(transform.position)
    let orientation = transform.orientation
    if (message !== undefined) {
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

        radialTranslate2(position, position, message.direction, TANK_SPEED * dt)
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

    vec2.add(position, position, tankMover.externalVelocity)
    if (!vec2.equals(vec2.create(), tankMover.externalVelocity)) {
      const newExternalVelocity = vec2.create()
      const dv = vec2.scale(
        vec2.create(),
        vec2.normalize(vec2.create(), tankMover.externalVelocity),
        EXTERNAL_VELOCITY_DECELERATION,
      )
      if (
        vec2.squaredLength(dv) >= vec2.squaredLength(tankMover.externalVelocity)
      ) {
        vec2.zero(newExternalVelocity)
      } else {
        vec2.subtract(newExternalVelocity, tankMover.externalVelocity, dv)
      }

      simState.entityManager.tankMovers.update(id, {
        externalVelocity: newExternalVelocity,
      })
    }

    simState.entityManager.transforms.update(id, { position, orientation })
  }
}
