import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { PickupConstructors } from '~/entities/pickups'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { radialTranslate2 } from '~/util/math'

export const update = (
  simState: Pick<
    SimState,
    'entityManager' | 'registerParticleEmitter' | 'frame'
  >,
): void => {
  for (const [id, damageable] of simState.entityManager.damageables) {
    const transform = simState.entityManager.transforms.get(id)!

    if (damageable.health <= 0) {
      const dropType = simState.entityManager.dropTypes.get(id)
      if (dropType !== undefined) {
        const core = PickupConstructors[dropType]()
        core.transform!.position = vec2.clone(transform.position)
        simState.entityManager.register(core)
      }
      simState.entityManager.markForDeletion(id)

      const emitterPos = radialTranslate2(
        vec2.create(),
        transform.position,
        transform.orientation,
        TILE_SIZE / 2,
      )

      if (simState.registerParticleEmitter !== undefined) {
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
        simState.registerParticleEmitter({
          emitter: explosion,
          entity: id,
          frame: simState.frame,
        })
      }
      // const player = simState.entityManager.getPlayer()
      // if (player && player.id === id) {
      //   g.setState(GameState.YouDied)
      // }
    }
  }
}
