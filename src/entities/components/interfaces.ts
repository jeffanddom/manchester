import { vec2 } from 'gl-matrix'

import { Transform } from './Transform'

import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Renderable } from '~/renderer/interfaces'

export interface IGenericComponent {
  update(e: Entity, g: Game, dt: number): void
}

export interface IRenderable {
  setFillStyle(s: string): void
  getRenderables(e: Entity): Renderable[]
}

export interface IDamagerLogic {
  aabb(transform: Transform): [vec2, vec2]
  update(transform: Transform, entityId: string, g: Game): void
}

export interface IMotionLogic {
  update(t: Transform, entityId: string, g: Game, dt: number): void
}

export interface IShooterLogic {
  update(t: Transform, entityId: string, g: Game, dt: number): void
}
