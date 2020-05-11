import { vec2 } from 'gl-matrix'

export const TILE_SIZE = 16
export const PLAYFIELD_TILE_WIDTH = 40
export const PLAYFIELD_TILE_HEIGHT = 30

export enum Terrain {
  Mountain,
  River,
  Grass,
  Unknown,
}
export interface Tile {
  type: Terrain
}

export interface GameMap {
  playfield: string
  entities: string
}

export const terrainByEncoding = {
  '.': Terrain.Grass,
  '~': Terrain.River,
  '^': Terrain.Mountain,
}

export const deserializeTerrain = (s: string): Terrain => {
  const t = terrainByEncoding[s]
  if (t === undefined) {
    return Terrain.Unknown
  }
  return t
}

export interface IEntity {
  id?: string
  game?: IGame
  position: vec2
  orientation: number

  update: () => void
  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IEntityManager {
  register: (e: IEntity) => void
  markForDeletion: (e: IEntity) => void

  update: () => void
  render: (ctx: CanvasRenderingContext2D) => void

  // getEntitiesAtTilePos: (pos: [number, number]) => IEntity[]
}

export interface IPlayfield {
  height: () => number
  width: () => number
  pixelHeight: () => number
  pixelWidth: () => number

  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IGame {
  playfield: IPlayfield
  entities: IEntityManager
}
