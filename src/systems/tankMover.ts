import { mat4, vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import {
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  DEFAULT_GUN_KICK as DEFAULT_GUN_RECOIL,
  DEFAULT_GUN_KNOCKBACK as DEFAULT_HIT_KNOCKBACK,
  EXTERNAL_VELOCITY_DECELERATION,
  TANK_ROT_SPEED,
  TANK_SPEED,
} from '~/constants'
import { DirectionMove } from '~/input/interfaces'
import { ClientMoveUpdate } from '~/network/ClientMessage'
import { SimState } from '~/simulate'
import {
  North2,
  PlusY3,
  Zero2,
  radialTranslate2,
  rotateUntil,
} from '~/util/math'

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

export const update = (simState: SimState, dt: number): void => {
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

    // Apply active dash
    if (tankMover.lastDashFrame !== undefined) {
      if (simState.frame - tankMover.lastDashFrame < DASH_DURATION) {
        const position = radialTranslate2(
          vec2.create(),
          transform.position,
          tankMover.dashDirection,
          DASH_SPEED * dt,
        )

        simState.entityManager.transforms.update(id, { position })
        continue // TODO: this should not short circuit external velocity
      }

      if (simState.frame - tankMover.lastDashFrame >= DASH_COOLDOWN) {
        simState.entityManager.tankMovers.update(id, {
          lastDashFrame: undefined,
        })
      }
    }

    const position = vec2.clone(transform.position)

    // Intrinsic motion
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

      const entityModel = simState.entityManager.entityModels.get(id)!
      simState.entityManager.entityModels.update(id, {
        modifiers: {
          ...entityModel.modifiers,
          'shiba:post': mat4.fromRotation(
            mat4.create(),

            // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
            -orientation,
            PlusY3,
          ),
        },
      })
    }

    const externalVelocity = vec2.clone(tankMover.externalVelocity)

    // apply sources of external velocity
    for (const event of simState.frameEvents) {
      if (event.entityId !== id) {
        continue
      }

      switch (event.type) {
        case FrameEventType.TankHit:
          {
            const recoil = vec2.scale(
              vec2.create(),
              vec2.rotate(vec2.create(), North2, Zero2, event.hitAngle),
              DEFAULT_GUN_RECOIL,
            )

            vec2.sub(externalVelocity, externalVelocity, recoil)
          }
          break

        case FrameEventType.TankShoot:
          {
            const knockback = vec2.scale(
              vec2.create(),
              vec2.rotate(vec2.create(), North2, Zero2, event.orientation),
              DEFAULT_HIT_KNOCKBACK,
            )

            vec2.sub(externalVelocity, externalVelocity, knockback)
          }
          break
      }
    }

    // adjust position by external velocity
    vec2.add(position, position, externalVelocity)

    // apply deceleration to external velocity
    if (!vec2.equals(vec2.create(), externalVelocity)) {
      const dv = vec2.scale(
        vec2.create(),
        vec2.normalize(vec2.create(), externalVelocity),
        EXTERNAL_VELOCITY_DECELERATION,
      )
      if (vec2.squaredLength(dv) >= vec2.squaredLength(externalVelocity)) {
        vec2.zero(externalVelocity)
      } else {
        vec2.subtract(externalVelocity, externalVelocity, dv)
      }
    }

    simState.entityManager.tankMovers.update(id, { externalVelocity })
    simState.entityManager.transforms.update(id, { position, orientation })
  }
}
