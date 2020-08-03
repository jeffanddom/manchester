import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Builder } from '~/entities/builder/Builder'
import { Damageable } from '~/entities/components/Damageable'
import { DefaultModelRenderable } from '~/entities/components/DefaultModelRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Team } from '~/entities/team'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'

export const make = (destination: vec2, host: string, path: vec2[]): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.builder = new Builder(destination, host, path)
  e.renderable = new DefaultModelRenderable(models.builder)

  e.team = Team.Friendly
  e.targetable = true
  e.damageable = new Damageable(
    0.1,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  return e
}
