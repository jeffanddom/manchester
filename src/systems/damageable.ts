import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { radialTranslate2 } from '~/util/math'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.transform || !e.damageable) {
      continue
    }

    if (e.damageable.health <= 0) {
      g.entities.markForDeletion(id)

      const emitterPos = radialTranslate2(
        vec2.create(),
        e.transform.position,
        e.transform.orientation,
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
      g.emitters.push(explosion)
    }
  }
}
