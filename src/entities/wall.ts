import { vec2 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { Type } from '~/entities/types'

const WALL_HEALTH = 4.0

export const makeWall = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.WALL

  e.transform = transform.make()
  e.wall = true
  e.targetable = true
  e.renderable = 'wall'
  e.damageable = damageable.make(WALL_HEALTH, {
    offset: vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
  })
  return e
}
