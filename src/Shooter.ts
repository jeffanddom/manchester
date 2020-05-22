import { IEntity, TILE_SIZE } from './common'
import { makeBullet } from './Bullet'
import { ParticleEmitter } from './ParticleEmitter'
import { vec2 } from 'gl-matrix'
import { radialTranslate2 } from './mathutil'

const keyMap = {
  fire: 32, // fire
}

export class Shooter {
  lastFiredAt: number

  constructor() {
    this.lastFiredAt = -1
  }

  update(entity: IEntity) {
    if (entity.game.keyboard.downKeys.has(keyMap.fire)) {
      if (Date.now() - this.lastFiredAt > 250) {
        const bulletPos = radialTranslate2(
          vec2.create(),
          entity.transform.position,
          entity.transform.orientation,
          TILE_SIZE * 0.75,
        )

        entity.game.entities.register(
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
        entity.game.emitters.push(muzzleFlash)

        this.lastFiredAt = Date.now()
      }
    }
  }
}
