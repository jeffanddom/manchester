import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'

export const tileBox = (pos: vec2): [vec2, vec2] => {
  return [
    vec2.fromValues(pos[0] - TILE_SIZE / 2, pos[1] - TILE_SIZE / 2),
    vec2.fromValues(pos[0] + TILE_SIZE / 2, pos[1] + TILE_SIZE / 2),
  ]
}

export const tileCoords = (position: vec2): vec2 => {
  return vec2.floor(
    vec2.create(),
    vec2.scale(vec2.create(), position, 1 / TILE_SIZE),
  )
}

export const tileToWorld = (tilePos: vec2): vec2 => {
  const v = vec2.create()
  vec2.scale(v, tilePos, TILE_SIZE)
  vec2.add(v, v, vec2.fromValues(TILE_SIZE / 2, TILE_SIZE / 2))
  return v
}
