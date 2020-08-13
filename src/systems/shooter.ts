import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { Game } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { getAngle, radialTranslate2 } from '~/util/math'

const COOLDOWN_PERIOD = 0.25

export class ShooterComponent {
  cooldownTtl: number
  orientation: number
  input: {
    target: vec2 | null
    fire: boolean
  }

  constructor() {
    this.cooldownTtl = 0
    this.orientation = 0
    this.input = { target: null, fire: false }
  }
}

export const update = (g: Game, dt: number): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.transform || !e.shooter) {
      continue
    }

    if (!e.shooter.input.target) {
      return
    }

    e.shooter.orientation = getAngle(
      e.transform.position,
      e.shooter.input.target,
    )

    if (e.shooter.cooldownTtl > 0) {
      e.shooter.cooldownTtl -= dt
      return
    }

    if (e.shooter.input.fire) {
      e.shooter.cooldownTtl = COOLDOWN_PERIOD

      const bulletPos = radialTranslate2(
        vec2.create(),
        e.transform.position,
        e.shooter.orientation,
        TILE_SIZE * 0.25,
      )

      g.entities.register(
        makeBullet({
          position: bulletPos,
          orientation: e.shooter.orientation,
          owner: id,
        }),
      )

      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: e.shooter.orientation,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })
      g.emitters.push(muzzleFlash)
    }
  }
}
