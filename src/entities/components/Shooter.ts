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

export class Shooter implements IGenericComponent {
  lastFiredAt: number

  constructor() {
    this.lastFiredAt = -1
  }

  update(entity: IEntity, game: IGame) {
    if (game.keyboard.downKeys.has(keyMap.fire)) {
      if (Date.now() - this.lastFiredAt > 250) {
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
          position: bulletPos,
          particleLifespan: 50,
          particleRadius: 3,
          particleRate: 4,
          particleSpeedRange: [2, 8],
          emitterLifespan: 100,
          orientation: entity.transform.orientation,
          arc: Math.PI / 4,
          colors: ['#FF9933', '#CCC', '#FFF'],
        })
        game.emitters.push(muzzleFlash)

        game.camera.shake()

        this.lastFiredAt = Date.now()
      }
    }
  }
}
