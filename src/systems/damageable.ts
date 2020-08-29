import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { PickupConstructors } from '~/entities/pickups'
import { Game, GameState } from '~/Game'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Primitive } from '~/renderer/interfaces'
import { radialTranslate2 } from '~/util/math'

export const update = (g: Game): void => {
  for (const id in g.server.entityManager.entities) {
    const e = g.server.entityManager.entities[id]
    const transform = e.transform
    const damageable = e.damageable
    if (!transform || !damageable) {
      continue
    }

    g.debugDraw(() => {
      const aabb = damageable.aabb(transform)
      const d = vec2.sub(vec2.create(), aabb[1], aabb[0])
      return [
        {
          primitive: Primitive.RECT,
          strokeStyle: 'cyan',
          pos: aabb[0],
          dimensions: d,
        },
      ]
    })

    if (damageable.health <= 0) {
      if (e.dropType) {
        const core = PickupConstructors[e.dropType]()
        core.transform!.position = vec2.clone(e.transform!.position)

        g.server.entityManager.register(core)
      }
      g.server.entityManager.markForDeletion(id)

      const emitterPos = radialTranslate2(
        vec2.create(),
        transform.position,
        transform.orientation,
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
      g.client.emitters.push(explosion)

      if (g.player && g.player.id === id) {
        g.setState(GameState.YouDied)
      }
    }
  }
}
