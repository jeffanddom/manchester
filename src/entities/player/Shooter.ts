import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/Bullet'
import { IGenericComponent } from '~/entities/components/interfaces'
import { IEntity } from '~/entities/interfaces'
import { IGame } from '~/interfaces'
import { MouseButton } from '~/Mouse'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { getAngle, radialTranslate2 } from '~/util/math'

const COOLDOWN_PERIOD = 0.25

export class Shooter implements IGenericComponent {
  cooldownTtl: number
  orientation: number

  constructor() {
    this.cooldownTtl = 0
    this.orientation = 0
  }

  update(entity: IEntity, game: IGame, dt: number) {
    const mousePos = game.mouse.getPos()
    if (mousePos.isNone()) {
      return
    }

    this.orientation = getAngle(
      entity.transform!.position,
      game.camera.viewToWorldspace(mousePos.unwrap()),
    )

    if (this.cooldownTtl > 0) {
      this.cooldownTtl -= dt
      return
    }

    if (game.mouse.isDown(MouseButton.LEFT)) {
      this.cooldownTtl = COOLDOWN_PERIOD

      const bulletPos = radialTranslate2(
        vec2.create(),
        entity.transform!.position,
        this.orientation,
        TILE_SIZE * 0.75,
      )

      game.entities.register(makeBullet(bulletPos, this.orientation))

      const muzzleFlash = new ParticleEmitter({
        spawnTtl: 0.1,
        position: bulletPos,
        particleTtl: 0.065,
        particleRadius: 3,
        particleRate: 240,
        particleSpeedRange: [120, 280],
        orientation: this.orientation,
        arc: Math.PI / 4,
        colors: ['#FF9933', '#CCC', '#FFF'],
      })
      game.emitters.push(muzzleFlash)

      game.camera.shake()
    }
  }
}
