import { vec2, vec4 } from 'gl-matrix'

import {
  EntityComponents,
  makeDefaultEntity,
} from '~/engine/sim/EntityComponents'
import * as damageable from '~/game/components/Damageable'
import * as transform from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { Type } from '~/game/entities/types'

const WALL_HEALTH = 4.0

export const makeWall = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.WALL

  e.transform = transform.make()
  e.wall = true
  e.targetable = true
  e.entityModel = {
    name: 'wall',
    color: vec4.fromValues(0.5, 0.5, 1, 1),
    modifiers: {},
  }
  e.damageable = damageable.make(WALL_HEALTH, {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  })
  return e
}
