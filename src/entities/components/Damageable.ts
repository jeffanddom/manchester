import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { radialTranslate2 } from '~/util/math'

export class Damageable {
  health: number
  hitbox: Hitbox

  constructor(health: number, hitbox: Hitbox) {
    this.health = health
    this.hitbox = hitbox
  }

  aabb(entity: Entity): [vec2, vec2] {
    return this.hitbox.aabb(
      entity.transform!.position,
      entity.transform!.orientation,
    )
  }

  update(entity: Entity, game: Game, _dt: number): void {
    if (this.health <= 0) {
      game.entities.markForDeletion(entity.id)

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
