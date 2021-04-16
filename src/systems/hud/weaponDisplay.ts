import { vec2 } from 'gl-matrix'

import { BulletType } from '~/components/Bullet'
import { EntityManager } from '~/entities/EntityManager'
import { Primitive2d, Renderable2d, TextAlign } from '~/renderer/Renderer2d'

export const update = (
  entityManager: EntityManager,
  playerNumber: number,
): Renderable2d[] => {
  const playerId = entityManager.getPlayerId(playerNumber)
  if (playerId === undefined) {
    return []
  }

  const shooter = entityManager.shooters.get(playerId)!
  shooter.bulletType

  return [
    {
      primitive: Primitive2d.TEXT,
      text: BulletType[shooter.bulletType].toUpperCase(),
      pos: vec2.fromValues(40, 15),
      hAlign: TextAlign.Min,
      vAlign: TextAlign.Min,
      font: '20px Impact',
      style: 'white',
    },
  ]
}
