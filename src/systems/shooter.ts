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
    const e = simState.entityManager.getPlayer(message.playerNumber)!
    if (
      e.shooter!.lastFiredFrame !== -1 &&
      message.frame - e.shooter!.lastFiredFrame < 15
    ) {
      return
    }

    simState.entityManager.checkpoint(e.id)

    e.shooter!.lastFiredFrame = message.frame
    e.shooter!.orientation = getAngle(e.transform!.position, message.targetPos)

    const bulletPos = radialTranslate2(
      vec2.create(),
      e.transform!.position,
      e.shooter!.orientation,
      TILE_SIZE * 0.25,
    )

    simState.entityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: e.shooter!.orientation,
        owner: e.id,
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
        orientation: e.shooter!.orientation,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })

      simState.registerParticleEmitter({
        emitter: muzzleFlash,
        entity: e.id,
        frame: simState.frame,
      })
    }
  })
}
