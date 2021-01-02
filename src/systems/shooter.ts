import { mat4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'
import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import {
  ClientMessageType,
  TankAimClientMessage,
} from '~/network/ClientMessage'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { getAngle, radialTranslate2 } from '~/util/math'

export type ShooterComponent = {
  cooldownTtl: number
  lastFiredFrame: number
  orientation: number
  input: {
    target: vec2 | null
    fire: boolean
  }
}

export function make(): ShooterComponent {
  return {
    cooldownTtl: 0,
    lastFiredFrame: -1,
    orientation: 0,
    input: { target: null, fire: false },
  }
}

export function clone(s: ShooterComponent): ShooterComponent {
  return {
    cooldownTtl: s.cooldownTtl,
    lastFiredFrame: s.lastFiredFrame,
    orientation: s.orientation,
    input: {
      target: s.input.target !== null ? vec2.clone(s.input.target) : null,
      fire: s.input.fire,
    },
  }
}

export const update = (simState: SimState): void => {
  const messages: Array<TankAimClientMessage> = []
  simState.messages.forEach((m) => {
    if (m.type === ClientMessageType.TANK_AIM) {
      messages.push(m)
    }
  })

  messages.forEach((message) => {
    const id = simState.entityManager.getPlayerId(message.playerNumber)!
    const shooter = simState.entityManager.shooters.get(id)!
    const transform = simState.entityManager.transforms.get(id)!
    const newAngle = getAngle(transform.position, message.targetPos)

    const entityModel = simState.entityManager.entityModels.get(id)!
    simState.entityManager.entityModels.update(id, {
      modifiers: {
        ...entityModel.modifiers,
        'tank.body.turret:post': mat4.fromRotation(
          mat4.create(),
          -newAngle, // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
          vec3.fromValues(0, 1, 0),
        ),
      },
    })

    if (
      !message.firing ||
      (shooter.lastFiredFrame !== -1 &&
        message.frame - shooter.lastFiredFrame < 15)
    ) {
      if (!glMatrix.equals(newAngle, shooter.orientation)) {
        simState.entityManager.shooters.update(id, { orientation: newAngle })
      }
      return
    }

    simState.entityManager.shooters.update(id, {
      lastFiredFrame: message.frame,
      orientation: newAngle,
    })

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      newAngle,
      TILE_SIZE * 0.25,
    )

    simState.entityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: newAngle,
        owner: id,
      }),
    )

    if (simState.registerParticleEmitter !== undefined) {
      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: newAngle,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })

      simState.registerParticleEmitter({
        emitter: muzzleFlash,
        entity: id,
        frame: simState.frame,
      })
    }
  })
}
