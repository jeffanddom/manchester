import { vec2 } from 'gl-matrix'
import { IEntity } from '~/entities/interfaces'
import { IGame } from '~/interfaces'
import { Camera } from '~/Camera'
import { Hitbox } from '~/Hitbox'

export interface ITransform {
  previousPosition: vec2
  position: vec2
  orientation: number

  update(): void
}

export interface IWallCollider {
  hitLastFrame: boolean
  collidedWalls: IEntity[]

  update(e: IEntity, g: IGame): void
}

export interface IGenericComponent {
  update(e: IEntity, g: IGame, dt: number): void
}

export interface IPathRenderable {
  fillStyle: string

  render(e: IEntity, ctx: CanvasRenderingContext2D, camera: Camera): void
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
