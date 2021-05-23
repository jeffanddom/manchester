import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'
import { DirectionMove } from '~/engine/input/interfaces'
import { ClientMoveUpdate } from '~/engine/network/ClientMessage'
import {
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  DEFAULT_BULLET_KNOCKBACK,
  DEFAULT_SHOT_RECOIL,
  EXTERNAL_VELOCITY_DECELERATION,
  TANK_ROT_SPEED,
  TANK_SPEED,
} from '~/game/constants'
import { FrameEventType } from '~/game/systems/FrameEvent'
import { WeaponType } from '~/game/systems/WeaponType'
import { North2, Zero2, radialTranslate2, rotateUntil } from '~/util/math'

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

export const update = (frameState: FrameState, dt: number): void => {
  const messages = new Map<number, ClientMoveUpdate>()
  frameState.messages.forEach((m) => {
    if (m.move !== undefined) {
      messages.set(m.playerNumber, m.move)
    }
  })

  for (const [id, tankMover] of frameState.stateDb.tankMovers) {
    const playerNumber = frameState.stateDb.playerNumbers.get(id)!
    const transform = frameState.stateDb.transforms.get(id)!
    const message = messages.get(playerNumber)

    // Apply active dash
    if (tankMover.lastDashFrame !== undefined) {
      if (frameState.frame - tankMover.lastDashFrame < DASH_DURATION) {
        const position = radialTranslate2(
          vec2.create(),
          transform.position,
          tankMover.dashDirection,
          DASH_SPEED * dt,
        )

        frameState.stateDb.transforms.update(id, { position })
        continue // TODO: this should not short circuit external velocity
      }

      if (frameState.frame - tankMover.lastDashFrame >= DASH_COOLDOWN) {
        frameState.stateDb.tankMovers.update(id, {
          lastDashFrame: undefined,
        })
      }
    }

    const position = vec2.clone(transform.position)

    // Intrinsic motion
    let orientation = transform.orientation
    if (message !== undefined) {
      if (message.dash && tankMover.lastDashFrame === undefined) {
        frameState.stateDb.tankMovers.update(id, {
          lastDashFrame: frameState.frame,
          dashDirection: message.direction,
        })
        orientation = message.direction
        frameState.stateDb.transforms.update(id, { orientation })
      } else {
        orientation = rotateUntil({
          from: transform.orientation,
          to: message.direction,
          amount: TANK_ROT_SPEED * dt,
        })

        radialTranslate2(position, position, message.direction, TANK_SPEED * dt)
      }
    }

    const externalVelocity = vec2.clone(tankMover.externalVelocity)

    // apply sources of external velocity
    for (const event of frameState.frameEvents) {
      if (!('entityId' in event) || event.entityId !== id) {
        continue
      }

      switch (event.type) {
        case FrameEventType.TankHit:
          {
            const knockback = vec2.scale(
              vec2.create(),
              vec2.rotate(
                vec2.create(),
                North2,
                Zero2,
                event.hitAngle + Math.PI,
              ),
              DEFAULT_BULLET_KNOCKBACK,
            )

            vec2.sub(externalVelocity, externalVelocity, knockback)
          }
          break

        case FrameEventType.TankShoot:
          {
            const recoil = vec2.create()
            switch (event.bulletType) {
              case WeaponType.Standard:
                {
                  vec2.scale(
                    recoil,
                    vec2.rotate(
                      vec2.create(),
                      North2,
                      Zero2,
                      event.orientation,
                    ),
                    DEFAULT_SHOT_RECOIL,
                  )
                }
                break

              default:
                // no recoil by default
                break
            }

            vec2.sub(externalVelocity, externalVelocity, recoil)
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

    frameState.stateDb.tankMovers.update(id, { externalVelocity })
    frameState.stateDb.transforms.update(id, { position, orientation })
  }
}
