import { vec2 } from 'gl-matrix'

import { Transform } from './Transform'

import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { Renderable } from '~/renderer/interfaces'

export interface IGenericComponent {
  update(e: Entity, g: Game, dt: number): void
}

export interface IRenderable {
  setFillStyle(s: string): void
  getRenderables(e: Entity): Renderable[]
}

export interface IDamager extends IGenericComponent {
  damageValue: number
  hitbox: Hitbox

  aabb(e: Entity): [vec2, vec2]
}

export interface IMotionLogic {
  update(t: Transform, entityId: string, g: Game, dt: number): void
}
