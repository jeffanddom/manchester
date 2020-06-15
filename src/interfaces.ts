import { vec2 } from 'gl-matrix'

import { Camera } from '~/Camera'
import { EntityManager } from '~/entities/EntityManager'
import { IEntity } from '~/entities/interfaces'
import { Keyboard } from '~/Keyboard'
import { Mouse } from '~/Mouse'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import * as terrain from '~/terrain'
import { Option } from '~/util/Option'

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

  setViewportDimensions(d: vec2): void
}

export interface TransformData {
  orientation: number
  position: vec2
}
