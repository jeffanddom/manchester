import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { path2 } from '~util/path2'
import { Rotator } from '~/entities/components/Rotator'
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

const TURRET_ROT_SPEED = Math.PI / 2

class Mover implements IGenericComponent {
  rotator: Rotator

  constructor() {
    this.rotator = new Rotator({ speed: TURRET_ROT_SPEED })
  }

  update(e: IEntity, g: IGame, dt: number): void {
    e.transform!.orientation = this.rotator.rotate({
      from: e.transform!,
      to: g.player.unwrapOr(e).transform!.position,
      dt,
    })
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
