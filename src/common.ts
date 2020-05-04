export const TILE_SIZE = 16
export const PLAYFIELD_TILE_WIDTH = 40
export const PLAYFIELD_TILE_HEIGHT = 30

export enum Terrain {
  Mountain,
  River,
  Grass,
}
export interface Tile {
  type: Terrain
}
export interface Position {
  x: number
  y: number
}
