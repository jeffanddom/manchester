import { IEntity } from '~/entities/interfaces'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/Bullet'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { vec2 } from 'gl-matrix'
import { radialTranslate2 } from '~/mathutil'
import { IGame } from '~/interfaces'
import { IGenericComponent } from '~/entities/components/interfaces'

const keyMap = {
  fire: 32, // fire
}

const COOLDOWN_PERIOD = 0.25

export class Shooter implements IGenericComponent {
  cooldownTtl: number

  constructor() {
    this.cooldownTtl = 0
  }

  update(entity: IEntity, game: IGame, dt: number) {
    if (this.cooldownTtl > 0) {
      this.cooldownTtl -= dt
      return
    }

    if (game.keyboard.downKeys.has(keyMap.fire)) {
      this.cooldownTtl = COOLDOWN_PERIOD

      const bulletPos = radialTranslate2(
        vec2.create(),
        entity.transform.position,
        entity.transform.orientation,
        TILE_SIZE * 0.75,
      )

      game.entities.register(
        makeBullet(bulletPos, entity.transform.orientation),
      )

      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: entity.transform.orientation,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })
      game.emitters.push(muzzleFlash)

      game.camera.shake()
    }
  }
}
