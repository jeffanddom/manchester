import { vec2 } from 'gl-matrix'

import {
  ClientMessage,
  ClientMessageType,
  TankShootClientMessage,
} from '~/ClientMessage'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { EntityManager } from '~/entities/EntityManager'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { getAngle, radialTranslate2 } from '~/util/math'

const COOLDOWN_PERIOD = 0.25

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

export const update = (simState: {
  entityManager: EntityManager
  messages: ClientMessage[]
}): void => {
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

    simState.entityManager.checkpointEntity(e.id)

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

    // const muzzleFlash = new ParticleEmitter({
    //   spawnTtl: 0.1,
    //   position: bulletPos,
    //   particleTtl: 0.065,
    //   particleRadius: 3,
    //   particleRate: 240,
    //   particleSpeedRange: [120, 280],
    //   orientation: e.shooter!.orientation,
    //   arc: Math.PI / 4,
    //   colors: ['#FF9933', '#CCC', '#FFF'],
    // })

    // client.emitters.push(muzzleFlash)
  })
}
