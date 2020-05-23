import { vec2 } from 'gl-matrix'
import { IEntity } from '../interfaces'
import { IGame } from '../../interfaces'

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
  update(e: IEntity, g: IGame): void
}

export interface IPathRenderable {
  fillStyle: string

  render(e: IEntity, ctx: CanvasRenderingContext2D): void
}

export interface IDamageable extends IGenericComponent {
  health: number
}

export interface IDamager extends IGenericComponent {
  damageValue: number
}
