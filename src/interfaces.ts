import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Camera } from '~/Camera'
import { Keyboard } from '~Keyboard'
import { Playfield } from '~/Playfield'
import { EntityManager } from '~entities/EntityManager'
import { IEntity } from '~entities/interfaces'
import { Option } from '~util/Option'
import { Mouse } from '~Mouse'

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
  mouse: Mouse
  emitters: ParticleEmitter[]
  camera: Camera

  player: Option<IEntity>
}
