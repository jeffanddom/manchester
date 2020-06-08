import { vec2 } from 'gl-matrix'
import { IEntity } from '~/entities/interfaces'
import { IGame } from '~/interfaces'
import { Hitbox } from '~/Hitbox'
import { Renderable } from '~renderer/interfaces'

export interface IWallCollider {
  hitLastFrame: boolean
  collidedWalls: IEntity[]

  update(e: IEntity, g: IGame): void
}

export interface IGenericComponent {
  update(e: IEntity, g: IGame, dt: number): void
}

export interface IRenderable {
  setFillStyle(s: string): void
  getRenderables(e: IEntity): Renderable[]
}

export interface IDamageable extends IGenericComponent {
  health: number
  hitbox: Hitbox

  aabb(e: IEntity): [vec2, vec2]
}

export interface IDamager extends IGenericComponent {
  damageValue: number
  hitbox: Hitbox

  aabb(e: IEntity): [vec2, vec2]
}
