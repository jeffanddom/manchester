import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { IEntityManager } from '~/entities/interfaces'
import { Camera } from '~/Camera'
import { vec2 } from 'gl-matrix'
import * as map from '~/map/interfaces'
import { Keyboard } from '~Keyboard'

export interface Tile {
  type: map.Terrain
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

export interface IGame {
  playfield: IPlayfield
  entities: IEntityManager
  keyboard: Keyboard
  emitters: ParticleEmitter[]
  camera: Camera
}
