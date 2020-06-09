import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IDamageable } from '~/entities/components/interfaces'
import { IEntity } from '~/entities/interfaces'
import { Hitbox } from '~/Hitbox'
import { IGame } from '~/interfaces'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { radialTranslate2 } from '~/util/math'

export class Damageable implements IDamageable {
  health: number
  hitbox: Hitbox

  constructor(health: number, hitbox: Hitbox) {
    this.health = health
    this.hitbox = hitbox
  }

  aabb(entity: IEntity) {
    return this.hitbox.aabb(
      entity.transform!.position,
      entity.transform!.orientation,
    )
  }

  update(entity: IEntity, game: IGame, _dt: number) {
    if (this.health <= 0) {
      game.entities.markForDeletion(entity)

      const emitterPos = radialTranslate2(
        vec2.create(),
        entity.transform!.position,
        entity.transform!.orientation,
        TILE_SIZE / 2,
      )
      const explosion = new ParticleEmitter({
        spawnTtl: 0.5,
        position: emitterPos,
        particleTtl: 0.2,
        particleRadius: 30,
        particleSpeedRange: [40, 300],
        particleRate: 120,
        orientation: 0,
        arc: Math.PI * 2,
        colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
      })
      game.emitters.push(explosion)
    }
  }
}
