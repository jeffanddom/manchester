import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/game/constants'
import { Immutable } from '~/types/immutable'
import { Aabb2 } from '~/util/aabb2'

export const tileBox = (pos: Immutable<vec2>): Aabb2 => {
  return [
    pos[0] - TILE_SIZE / 2,
    pos[1] - TILE_SIZE / 2,
    pos[0] + TILE_SIZE / 2,
    pos[1] + TILE_SIZE / 2,
  ]
}

export const tileCoords = (out: vec2, position: Immutable<vec2>): vec2 => {
  out[0] = Math.floor(position[0] / TILE_SIZE)
  out[1] = Math.floor(position[1] / TILE_SIZE)
  return out
}

export const tileToWorld = (out: vec2, tilePos: vec2): vec2 => {
  out[0] = tilePos[0] * TILE_SIZE + TILE_SIZE / 2
  out[1] = tilePos[1] * TILE_SIZE + TILE_SIZE / 2
  return out
}
