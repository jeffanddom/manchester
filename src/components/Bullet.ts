import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Immutable } from '~/types/immutable'

const BULLET_RANGE = 10 * TILE_SIZE

export type Bullet = {
  origin: vec2
  range: number
}

export function make(origin: vec2): Bullet {
  return {
    origin: vec2.clone(origin),
    range: BULLET_RANGE,
  }
}

export function clone(b: Immutable<Bullet>): Bullet {
  return {
    origin: vec2.clone(b.origin),
    range: b.range,
  }
}
