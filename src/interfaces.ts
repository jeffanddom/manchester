import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Camera } from '~/Camera'
import { Keyboard } from '~Keyboard'
import * as terrain from '~terrain'
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
  terrain: terrain.Layer
  entities: EntityManager
  keyboard: Keyboard
  mouse: Mouse
  emitters: ParticleEmitter[]
  camera: Camera

  player: Option<IEntity>
}
