import { vec2 } from 'gl-matrix'

import { PickupType } from '../pickup'

import { TILE_SIZE } from '~/constants'
import { Builder, BuilderMode } from '~/entities/builder/Builder'
import { Damageable } from '~/entities/components/Damageable'
import { DefaultModelRenderable } from '~/entities/components/DefaultModelRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Team } from '~/entities/team'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'

export const make = (params: {
  source: vec2
  destination: vec2
  mode: BuilderMode
  host: string
  path: vec2[]
}): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.transform.position = params.source

  if (params.mode === BuilderMode.BUILD_TURRET) {
    e.dropType = PickupType.Core
  }

  e.builder = new Builder({
    mode: params.mode,
    target: params.destination,
    host: params.host,
    path: params.path,
  })
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
