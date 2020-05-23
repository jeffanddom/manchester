import { vec2 } from 'gl-matrix'
import { TILE_SIZE } from './constants'

export const tileBox = (pos: vec2) => {
  return [
    vec2.fromValues(pos[0] - TILE_SIZE / 2, pos[1] - TILE_SIZE / 2),
    vec2.fromValues(pos[0] + TILE_SIZE / 2, pos[1] + TILE_SIZE / 2),
  ]
}
export const tileCoords = (position: vec2): [number, number] => {
  return [
    Math.floor(position[0] / TILE_SIZE),
    Math.floor(position[1] / TILE_SIZE),
  ]
}
export const equals = (c1: [number, number], c2: [number, number]) => {
  return c1[0] === c2[0] && c1[1] === c2[1]
}
