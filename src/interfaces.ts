import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { IEntityManager } from '~/entities/interfaces'
import { Camera } from '~/Camera'
import { vec2 } from 'gl-matrix'

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
  minWorldPos: () => vec2
  maxWorldPos: () => vec2
  dimensions: () => vec2

  render: (ctx: CanvasRenderingContext2D, camera: Camera) => void
}

export interface IKeyboard {
  downKeys: Set<number>
}

export interface IGame {
  playfield: IPlayfield
  entities: IEntityManager
  keyboard: IKeyboard
  emitters: ParticleEmitter[]
  camera: Camera
}
