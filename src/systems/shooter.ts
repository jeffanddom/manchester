import { mat4 } from 'gl-matrix'
import { glMatrix, vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import {
  BULLET_TYPE_LENGTH,
  BulletConfig,
  BulletType,
} from '~/components/Bullet'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { SimState } from '~/simulate'
import * as emitter from '~/systems/emitter'
import { PlusY3, getAngle, radialTranslate2 } from '~/util/math'

const firingInformation: Record<
  BulletType,
  { cooldown: number; mode: 'down' | 'held' }
> = {
  [BulletType.Standard]: { cooldown: 15, mode: 'held' },
  [BulletType.Rocket]: { cooldown: 18, mode: 'down' },
  [BulletType.Mortar]: { cooldown: 18, mode: 'down' },
}

export type ShooterComponent = {
  lastFiredFrame: number
  orientation: number
  bulletType: BulletType
  input: {
    target: vec2 | undefined
    fire: boolean
  }
}

export function make(): ShooterComponent {
  return {
    lastFiredFrame: -1,
    orientation: 0,
    bulletType: BulletType.Standard,
    input: { target: undefined, fire: false },
  }
}

export function clone(s: ShooterComponent): ShooterComponent {
  return {
    lastFiredFrame: s.lastFiredFrame,
    orientation: s.orientation,
    bulletType: s.bulletType,
    input: {
      target:
        s.input.target !== undefined ? vec2.clone(s.input.target) : undefined,
      fire: s.input.fire,
    },
  }
}

export const update = (simState: SimState): void => {
  simState.messages.forEach((message) => {
    const id = simState.entityManager.getPlayerId(message.playerNumber)!
    const shooter = simState.entityManager.shooters.get(id)!

    if (message.changeWeapon) {
      let nextType = shooter.bulletType + 1
      if (nextType >= BULLET_TYPE_LENGTH) {
        nextType = 0 as BulletType
      }
      simState.entityManager.shooters.update(id, { bulletType: nextType })
    }
    if (message.attack === undefined) {
      return
    }

    const transform = simState.entityManager.transforms.get(id)!
    const newAngle = getAngle(transform.position, message.attack.targetPos)

    const entityModel = simState.entityManager.entityModels.get(id)!
    simState.entityManager.entityModels.update(id, {
      modifiers: {
        ...entityModel.modifiers,
        'shiba.head:post': mat4.fromRotation(
          mat4.create(),

          // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
          // It is applied against the tank's orientation to track the mouse at all angles.
          transform.orientation - newAngle,
          PlusY3,
        ),
      },
    })

    let fireTriggered = false
    switch (firingInformation[shooter.bulletType].mode) {
      case 'held':
        fireTriggered = message.attack.fireHeld
        break
      case 'down':
        fireTriggered = message.attack.fireDown
        break
    }
    const cooldown = firingInformation[shooter.bulletType].cooldown
    const coolingDown =
      shooter.lastFiredFrame !== -1 &&
      message.frame - shooter.lastFiredFrame < cooldown

    if (!fireTriggered || coolingDown) {
      if (!glMatrix.equals(newAngle, shooter.orientation)) {
        simState.entityManager.shooters.update(id, {
          input: { ...shooter.input, target: message.attack.targetPos },
          orientation: newAngle,
        })
      }
      return
    }

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      newAngle,
      TILE_SIZE * 0.25,
    )

    let config: BulletConfig
    switch (shooter.bulletType) {
      case BulletType.Standard:
        config = { origin: bulletPos, type: shooter.bulletType }
        break
      case BulletType.Rocket:
        config = { origin: bulletPos, type: shooter.bulletType }
        break
      case BulletType.Mortar:
        config = {
          origin: bulletPos,
          type: shooter.bulletType,
          target: message.attack.targetPos,
        }
        break
    }

    const newBullet = makeBullet({
      orientation: newAngle,
      owner: id,
      config,
    })

    // Shoot the bullet if creation was successful
    if (newBullet.bullet !== undefined) {
      simState.entityManager.shooters.update(id, {
        input: { ...shooter.input, target: message.attack.targetPos },
        lastFiredFrame: message.frame,
        orientation: newAngle,
      })

      simState.frameEvents.push({
        type: FrameEventType.TankShoot,
        entityId: id,
        orientation: shooter.orientation,
        bulletType: shooter.bulletType,
      })

      simState.entityManager.emitters.set(
        id,
        emitter.make('tankShot', vec2.fromValues(0, 0), 0),
      )

      simState.entityManager.register(newBullet)
    }
  })
}
