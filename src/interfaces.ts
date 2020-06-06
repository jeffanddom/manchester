import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Camera } from '~/Camera'
import * as map from '~/map/interfaces'
import { Keyboard } from '~Keyboard'
import { Playfield } from '~/Playfield'
import { EntityManager } from '~entities/EntityManager'
import { IEntity } from '~entities/interfaces'

export interface Tile {
  type: map.Terrain
}

export enum Direction {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export interface IGame {
  playfield: Playfield
  entities: EntityManager
  keyboard: Keyboard
  emitters: ParticleEmitter[]
  camera: Camera

  player: IEntity
}
