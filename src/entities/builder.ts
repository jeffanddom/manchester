import { vec2 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import * as models from '~/models'
import { BuilderComponent, BuilderMode } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'

export const make = (params: {
  source: vec2
  destination: vec2
  mode: BuilderMode
  host: EntityId
  path: vec2[]
}): EntityComponents => {
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
  e.damageable = damageable.make(0.1, {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  })
  e.hitbox = {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  }

  return e
}
