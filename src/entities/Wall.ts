import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { IPrerenderScript } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { lerp } from '~/util/math'

const WALL_HEALTH = 4.0

class DisplayWallDamage implements IPrerenderScript {
  update(entityId: string, g: Game): void {
    const entity = g.entities.entities[entityId]
    const color = lerp(90, 130, entity!.damageable!.health / WALL_HEALTH)
    entity!.renderable!.setFillStyle(`rgba(${color},${color},${color},1)`)
  }
}

export const makeWall = (model: {
  path: Array<vec2>
  fillStyle: string
}): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.wall = true
  e.renderable = new PathRenderable(model.path, model.fillStyle)
  e.damageable = new Damageable(
    WALL_HEALTH,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  e.prerenderScript = new DisplayWallDamage()
  return e
}
