import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Camera } from '~/Camera'
import * as map from '~/map/interfaces'
import { Keyboard } from '~Keyboard'
import { Playfield } from '~/Playfield'
import { EntityManager } from '~entities/EntityManager'

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

export interface IGame {
  playfield: Playfield
  entities: EntityManager
  keyboard: Keyboard
  emitters: ParticleEmitter[]
  camera: Camera
}
