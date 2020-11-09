import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import {
  ClientMessageType,
  TankShootClientMessage,
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
  const messages: Array<TankShootClientMessage> = []
  simState.messages.forEach((m) => {
    if (m.type === ClientMessageType.TANK_SHOOT) {
      messages.push(m)
    }
  })

  messages.forEach((message) => {
    const id = simState.entityManager.getPlayerId(message.playerNumber)!
    const shooter = simState.entityManager.shooters.get(id)!

    if (
      shooter.lastFiredFrame !== -1 &&
      message.frame - shooter.lastFiredFrame < 15
    ) {
      return
    }

    const shooterMutable = simState.entityManager.shooters.checkpoint(id)!
    const transform = simState.entityManager.transforms.get(id)!

    shooterMutable.lastFiredFrame = message.frame
    shooterMutable.orientation = getAngle(transform.position, message.targetPos)

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      shooterMutable.orientation,
      TILE_SIZE * 0.25,
    )

    simState.entityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: shooterMutable.orientation,
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
        orientation: shooterMutable.orientation,
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
