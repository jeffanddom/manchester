import { vec2 } from 'gl-matrix'
import { TILE_SIZE } from '~/constants'

export const tileBox = (pos: vec2) => {
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
