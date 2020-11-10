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

export class ShooterComponent {
  cooldownTtl: number
  lastFiredFrame: number
  orientation: number
  input: {
    target: vec2 | null
    fire: boolean
  }

  constructor() {
    this.cooldownTtl = 0
    this.lastFiredFrame = -1
    this.orientation = 0
    this.input = { target: null, fire: false }
  }

  clone(): ShooterComponent {
    const c = new ShooterComponent()

    c.cooldownTtl = this.cooldownTtl
    c.lastFiredFrame = this.lastFiredFrame
    c.orientation = this.orientation
    c.input = {
      target: this.input.target ? vec2.clone(this.input.target) : null,
      fire: this.input.fire,
    }

    return c
  }
}

export const update = (
  simState: Pick<
    SimState,
    'entityManager' | 'messages' | 'registerParticleEmitter' | 'frame'
  >,
): void => {
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

    if (
      !message.firing ||
      (shooter.lastFiredFrame !== -1 &&
        message.frame - shooter.lastFiredFrame < 15)
    ) {
      if (!glMatrix.equals(newAngle, shooter.orientation)) {
        simState.entityManager.checkpoint(id)
        shooter.orientation = newAngle
      }

      return
    }

    simState.entityManager.checkpoint(id)

    shooter.lastFiredFrame = message.frame
    shooter.orientation = newAngle

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      shooter.orientation,
      TILE_SIZE * 0.25,
    )

    simState.entityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: shooter.orientation,
        owner: id,
      }),
    )

    if (simState.registerParticleEmitter) {
      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: shooter.orientation,
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
