import { mat4 } from 'gl-matrix'
import { glMatrix, vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'
import { BulletConfig } from '~/game/components/Bullet'
import { TILE_SIZE } from '~/game/constants'
import { makeBuilder } from '~/game/entities/builder'
import { makeBullet } from '~/game/entities/bullet'
import * as emitter from '~/game/systems/emitter'
import { FrameEventType } from '~/game/systems/FrameEvent'
import { WEAPON_TYPE_LENGTH, WeaponType } from '~/game/systems/WeaponType'
import { PlusY3, getAngle, radialTranslate2 } from '~/util/math'

const firingInformation: Record<
  WeaponType,
  { cooldown: number; mode: 'down' | 'held' }
> = {
  [WeaponType.Standard]: { cooldown: 15, mode: 'held' },
  [WeaponType.Rocket]: { cooldown: 18, mode: 'down' },
  [WeaponType.Mortar]: { cooldown: 18, mode: 'down' },
  [WeaponType.Builder]: { cooldown: 15, mode: 'down' },
}

export type ShooterComponent = {
  lastFiredFrame: number
  orientation: number
  weaponType: WeaponType
  input: {
    target: vec2 | undefined
    fire: boolean
  }
}

export function make(): ShooterComponent {
  return {
    lastFiredFrame: -1,
    orientation: 0,
    weaponType: WeaponType.Standard,
    input: { target: undefined, fire: false },
  }
}

export function clone(s: ShooterComponent): ShooterComponent {
  return {
    lastFiredFrame: s.lastFiredFrame,
    orientation: s.orientation,
    weaponType: s.weaponType,
    input: {
      target:
        s.input.target !== undefined ? vec2.clone(s.input.target) : undefined,
      fire: s.input.fire,
    },
  }
}

export const update = (frameState: FrameState): void => {
  frameState.messages.forEach((message) => {
    const id = frameState.stateDb.getPlayerId(message.playerNumber)!
    const shooter = frameState.stateDb.shooters.get(id)!

    if (message.changeWeapon) {
      let nextType = shooter.weaponType + 1
      if (nextType >= WEAPON_TYPE_LENGTH) {
        nextType = 0 as WeaponType
      }
      frameState.stateDb.shooters.update(id, { weaponType: nextType })
    }
    if (message.attack === undefined) {
      return
    }

    const transform = frameState.stateDb.transforms.get(id)!
    const newAngle = getAngle(transform.position, message.attack.targetPos)

    const entityModel = frameState.stateDb.entityModels.get(id)!
    frameState.stateDb.entityModels.update(id, {
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
    switch (firingInformation[shooter.weaponType].mode) {
      case 'held':
        fireTriggered = message.attack.fireHeld
        break
      case 'down':
        fireTriggered = message.attack.fireDown
        break
    }
    const cooldown = firingInformation[shooter.weaponType].cooldown
    const coolingDown =
      shooter.lastFiredFrame !== -1 &&
      message.frame - shooter.lastFiredFrame < cooldown

    if (!fireTriggered || coolingDown) {
      if (!glMatrix.equals(newAngle, shooter.orientation)) {
        frameState.stateDb.shooters.update(id, {
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

    if (shooter.weaponType === WeaponType.Builder) {
      const newBuilder = makeBuilder({
        source: bulletPos,
        destination: message.attack.targetPos,
      })
      frameState.stateDb.registerEntity(newBuilder)
      return
    }

    let config: BulletConfig
    switch (shooter.weaponType) {
      case WeaponType.Standard:
        config = { origin: bulletPos, type: shooter.weaponType }
        break
      case WeaponType.Rocket:
        config = { origin: bulletPos, type: shooter.weaponType }
        break
      case WeaponType.Mortar:
        config = {
          origin: bulletPos,
          type: shooter.weaponType,
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
      frameState.stateDb.shooters.update(id, {
        input: { ...shooter.input, target: message.attack.targetPos },
        lastFiredFrame: message.frame,
        orientation: newAngle,
      })

      frameState.frameEvents.push({
        type: FrameEventType.TankShoot,
        entityId: id,
        orientation: shooter.orientation,
        bulletType: shooter.weaponType,
      })

      frameState.stateDb.emitters.set(
        id,
        emitter.make('tankShot', vec2.fromValues(0, 0), 0),
      )

      frameState.stateDb.registerEntity(newBullet)
    }
  })
}
