import { vec2 } from 'gl-matrix'

import { Team } from '~/components/team'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { Game } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive } from '~/renderer/interfaces'
import { segmentToAabb } from '~/util/collision'
import { getAngle, radialTranslate2, rotateUntil } from '~/util/math'

const TURRET_ROT_SPEED = Math.PI / 2
const RANGE = 240
const COOLDOWN_PERIOD = 0.25

export class TurretComponent {
  cooldownTtl: number

  constructor() {
    this.cooldownTtl = 0
  }
}

export const update = (g: Game, dt: number): void => {
  for (const id in g.serverEntityManager.entities) {
    const e = g.serverEntityManager.entities[id]
    if (!e.turret) {
      continue
    }

    // I. Find a target

    const shootables = Object.values(g.serverEntityManager.entities)
      .filter(
        (other) =>
          !!other.transform &&
          !!other.damageable &&
          other.targetable &&
          !other.obscured &&
          other.id !== e.id,
      )
      .filter(
        (other) =>
          vec2.distance(other.transform!.position, e.transform!.position) <=
          RANGE,
      )
      .sort(
        (a, b) =>
          vec2.distance(a.transform!.position, e.transform!.position) -
          vec2.distance(b.transform!.position, e.transform!.position),
      )

    const target = shootables.find((candidate, n) => {
      if (candidate.team === Team.Neutral || candidate.team === e.team) {
        return false
      }

      const lineOfSight: [vec2, vec2] = [
        e.transform!.position,
        candidate.transform!.position,
      ]

      for (let i = 0; i < n; i++) {
        if (
          segmentToAabb(
            lineOfSight,
            shootables[i].damageable!.aabb(shootables[i].transform!),
          )
        ) {
          return false
        }
      }

      return true
    })

    if (!target) {
      continue
    }

    g.debugDraw(() => [
      {
        primitive: Primitive.LINE,
        width: 1,
        style: 'purple',
        from: e.transform!.position,
        to: target.transform!.position,
      },
    ])

    // II. Move toward target

    e.transform!.orientation = rotateUntil({
      from: e.transform!.orientation,
      to: getAngle(e.transform!.position, target.transform!.position),
      amount: TURRET_ROT_SPEED * dt,
    })

    // III. Shoot at target

    if (e.turret!.cooldownTtl > 0) {
      e.turret!.cooldownTtl -= dt
      continue
    }

    e.turret!.cooldownTtl = COOLDOWN_PERIOD

    const bulletPos = radialTranslate2(
      vec2.create(),
      e.transform!.position,
      e.transform!.orientation,
      TILE_SIZE * 0.25,
    )

    g.serverEntityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: e.transform!.orientation,
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
      orientation: e.transform!.orientation,
      arc: Math.PI / 4,
      colors: ['#FF9933', '#CCC', '#FFF'],
    })
    g.emitters.push(muzzleFlash)
  }
}
