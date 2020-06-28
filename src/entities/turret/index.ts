import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/Bullet'
import { Damageable } from '~/entities/components/Damageable'
import { IMotionScript, IShooterScript } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive } from '~/renderer/interfaces'
import { segmentToAabb } from '~/util/collision'
import { radialTranslate2 } from '~/util/math'
import { path2 } from '~/util/path2'
import { rotate } from '~/util/rotator'

const TURRET_ROT_SPEED = Math.PI / 2

class MotionScript implements IMotionScript {
  update(transform: Transform, _entityId: string, g: Game, dt: number): void {
    transform.orientation = rotate({
      from: transform,
      to: g.player.unwrap().transform!.position,
      speed: TURRET_ROT_SPEED,
      dt,
    })
  }
}

const COOLDOWN_PERIOD = 0.5

class ShooterScript implements IShooterScript {
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

export const makeTurret = (model: {
  path: path2
  fillStyle: string
}): Entity => {
  const e = new Entity()
  e.transform = new Transform()

  e.motionScript = new MotionScript()
  e.shooterScript = new ShooterScript()

  e.wall = true
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
      false,
    ),
  )
  e.renderable = new PathRenderable(model.path, model.fillStyle)

  return e
}
