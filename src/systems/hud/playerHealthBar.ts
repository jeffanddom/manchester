import { vec2 } from 'gl-matrix'

import { EntityManager } from '~/entities/EntityManager'
import { IRenderer, Primitive } from '~/renderer/interfaces'
import { inverseLerp, lerp } from '~/util/math'

export const update = (
  simState: {
    entityManager: EntityManager
    playerNumber: number
  },
  renderer: IRenderer,
): void => {
  const player = simState.entityManager.getPlayer(simState.playerNumber)
  if (!player) {
    return
  }

  const damageable = player.damageable!
  const maxFill = 100
  const fill = lerp(
    0,
    maxFill,
    inverseLerp(0, damageable.maxHealth, damageable.health),
  )
  const y = 15

  // background
  renderer.render({
    primitive: Primitive.RECT,
    pos: vec2.fromValues(15, y),
    dimensions: vec2.fromValues(15, maxFill),
    fillStyle: 'rgba(200, 200, 200, 0.3)',
    strokeStyle: 'rgba(128, 128, 128, 0.8)',
  })

  // fill
  renderer.render({
    primitive: Primitive.RECT,
    pos: vec2.fromValues(15, y + maxFill - fill),
    dimensions: vec2.fromValues(15, fill),
    fillStyle: 'rgba(192, 36, 36, 0.7)',
  })
}
