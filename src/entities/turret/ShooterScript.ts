import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/Bullet'
import { IShooterScript } from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive } from '~/renderer/interfaces'
import { segmentToAabb } from '~/util/collision'
import { radialTranslate2 } from '~/util/math'

const COOLDOWN_PERIOD = 0.5

export class ShooterScript implements IShooterScript {
  cooldownTtl: number

  constructor() {
    this.cooldownTtl = 0
  }

  update(transform: Transform, entityId: string, g: Game, dt: number): void {
    const range = 240

    g.player.map((player) => {
      if (
        vec2.distance(player.transform!.position, transform.position) >
        range * 2
      ) {
        return
      }

      // Line of sight
      const lineOfSight: [vec2, vec2] = [
        transform.position,
        player.transform!.position,
      ]

      const potentialHits = []
      for (const id in g.entities.entities) {
        const other = g.entities.entities[id]

        if (!other.damageable || !other.transform || id === entityId) {
          continue
        }

        if (
          segmentToAabb(lineOfSight, other.damageable.aabb(other.transform))
        ) {
          potentialHits.push(other)
        }
      }

      if (potentialHits.length === 0) {
        return
      }

      const hitsWithDistance = potentialHits
        .map((hit): [Entity, number] => {
          return [
            hit,
            vec2.distance(hit.transform!.position, transform.position),
          ]
        })
        .sort((a, b) => {
          return a[1] - b[1]
        })

      g.debugDraw(() => [
        {
          primitive: Primitive.LINE,
          width: 1,
          style: 'purple',
          from: transform.position,
          to: player.transform!.position,
        },
        {
          primitive: Primitive.LINE,
          width: 1,
          style: 'red',
          from: transform.position,
          to: hitsWithDistance[0][0].transform!.position,
        },
      ])

      if (this.cooldownTtl > 0) {
        this.cooldownTtl -= dt
        return
      }

      // Something is in the way
      if (hitsWithDistance[0][0] !== player) {
        return
      }

      this.cooldownTtl = COOLDOWN_PERIOD

      const bulletPos = radialTranslate2(
        vec2.create(),
        transform.position,
        transform.orientation,
        TILE_SIZE * 1.5,
      )

      g.entities.register(
        makeBullet({
          position: bulletPos,
          orientation: transform.orientation,
          range: 240,
        }),
      )

      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: transform.orientation,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })
      g.emitters.push(muzzleFlash)
    })
  }
}
