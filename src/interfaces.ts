import { ParticleEmitter } from './particles/ParticleEmitter'
import { IEntityManager } from './entities/interfaces'

export enum Terrain {
  Mountain,
  River,
  Grass,
  Unknown,
}

export interface Tile {
  type: Terrain
}

export enum Direction {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export interface GameMap {
  playfield: string
  entities: string
}

export interface IPlayfield {
  height: () => number
  width: () => number
  pixelHeight: () => number
  pixelWidth: () => number

  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IKeyboard {
  downKeys: Set<number>
}

export interface IGame {
  playfield: IPlayfield
  entities: IEntityManager
  keyboard: IKeyboard
  emitters: ParticleEmitter[]
}
