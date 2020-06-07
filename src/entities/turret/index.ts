import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { path2 } from '~util/path2'
import { Transform } from '~/entities/components/Transform'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { IEntity } from '~/entities/interfaces'
import { Damageable } from '~entities/components/Damageable'
import { Hitbox } from '~Hitbox'
import { vec2 } from 'gl-matrix'
import { IGenericComponent } from '~entities/components/interfaces'
import { IGame } from '~interfaces'
import { ParticleEmitter } from '~particles/ParticleEmitter'
import { makeBullet } from '~entities/Bullet'
import { radialTranslate2 } from '~util/math'

const normalizeAngle = (theta: number): number => {
  if (theta > Math.PI) {
    return theta - 2 * Math.PI
  } else if (theta < -Math.PI) {
    return theta + 2 * Math.PI
  }
  return theta
}

const ROT_SPEED = Math.PI / 2

const getAngularDistance = (from: Transform, to: Transform): number => {
  const offset = vec2.sub(vec2.create(), to.position, from.position)
  const targetOrientation =
    Math.sign(offset[0]) * vec2.angle(vec2.fromValues(0, -1), offset)
  return normalizeAngle(targetOrientation - from.orientation)
}

class Mover implements IGenericComponent {
  update(e: IEntity, g: IGame, dt: number): void {
    const diff = getAngularDistance(e.transform!, g.player.transform!)
    const disp = dt * ROT_SPEED
    e.transform!.orientation +=
      disp >= Math.abs(diff) ? diff : Math.sign(diff) * disp
    e.transform!.orientation = normalizeAngle(e.transform!.orientation)
  }
}

const COOLDOWN_PERIOD = 0.5

export class Shooter implements IGenericComponent {
  cooldownTtl: number

  constructor() {
    this.cooldownTtl = 0
  }

  update(e: IEntity, g: IGame, dt: number) {
    if (this.cooldownTtl > 0) {
      this.cooldownTtl -= dt
      return
    }

    const diff = getAngularDistance(e.transform!, g.player.transform!)
    if (diff < -0.05 || 0.05 < diff) {
      return
    }

    this.cooldownTtl = COOLDOWN_PERIOD

    const bulletPos = radialTranslate2(
      vec2.create(),
      e.transform!.position,
      e.transform!.orientation,
      TILE_SIZE * 1.5,
    )

    g.entities.register(makeBullet(bulletPos, e.transform!.orientation))

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

export const makeTurret = (model: {
  path: path2
  fillStyle: string
}): IEntity => {
  const e = new Entity()
  e.transform = new Transform()

  e.mover = new Mover()
  e.shooter = new Shooter()

  e.wall = { update: () => {} }
  // e.shooter = new Shooter()
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  e.renderable = new PathRenderable(model.path, model.fillStyle)

  return e
}
