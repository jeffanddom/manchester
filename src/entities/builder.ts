import { vec4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { EntityComponents, makeDefaultEntity } from '~/sim/EntityComponents'

export const makeBuilder = (params: {
  source: vec2
  destination: vec2
}): EntityComponents => {
  const e = makeDefaultEntity()
  e.transform = transform.make()
  e.transform.position = params.source

  e.builder = {
    target: params.destination,
  }

  e.entityModel = {
    name: 'core',
    color: vec4.fromValues(0, 1, 1, 1),
    modifiers: {},
  }

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
