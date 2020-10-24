import { vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import { Team } from '~/components/team'
import * as transform from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { Entity, makeDefaultEntity } from '~/entities/Entity'
import { EntityId } from '~/entities/EntityId'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'
import { BuilderComponent, BuilderMode } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'

export const make = (params: {
  source: vec2
  destination: vec2
  mode: BuilderMode
  host: EntityId
  path: vec2[]
}): Entity => {
  const e = makeDefaultEntity()
  e.transform = transform.make()
  e.transform.position = params.source

  if (params.mode === BuilderMode.BUILD_TURRET) {
    e.dropType = PickupType.Core
  } else if (params.mode === BuilderMode.BUILD_WALL) {
    e.dropType = PickupType.Wood
  }

  e.builder = new BuilderComponent({
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
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )

  return e
}
