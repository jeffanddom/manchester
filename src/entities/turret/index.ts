import { vec2 } from 'gl-matrix'

import { IPrerenderScript } from '../components/interfaces'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Team } from '~/entities/team'
import { Turret } from '~/entities/turret/Turret'
import { TurretRenderables } from '~/entities/turret/TurretRenderables'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'

class TurretPrerender implements IPrerenderScript {
  update(entityId: string, g: Game): void {
    const entity = g.entities.entities[entityId]
    switch (entity.team) {
      case Team.Friendly:
        entity!.renderable!.setFillStyle('blue')
        break
      case Team.Enemy:
        entity!.renderable!.setFillStyle('red')
        break
    }
  }
}

export const makeTurret = (_model: {
  path: Array<vec2>
  fillStyle: string
}): Entity => {
  const e = new Entity()
  e.wall = true
  e.team = Team.Enemy

  e.transform = new Transform()
  e.turret = new Turret()
  e.damageable = new Damageable(
    3,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
      false,
    ),
  )
  e.renderable = new TurretRenderables()
  e.prerenderScript = new TurretPrerender()

  return e
}
