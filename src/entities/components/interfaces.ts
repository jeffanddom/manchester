import { vec2 } from 'gl-matrix'

import { Transform } from './Transform'

import { Entity } from '~/entities/Entity'
import { Team } from '~/entities/team'
import { Game } from '~/Game'
import { Renderable } from '~/renderer/interfaces'

export interface IRenderable {
  setFillStyle(s: string): void
  getRenderables(e: Entity): Renderable[]
}

export interface IPickupScript {
  aabb(transform: Transform): [vec2, vec2]
  update(g: Game): void
}

export interface IMotionScript {
  update(t: Transform, entityId: string, g: Game, dt: number): void
}

export interface IShooterScript {
  update(t: Transform, team: Team, entityId: string, g: Game, dt: number): void
}

export interface IPrerenderScript {
  update(entityId: string, g: Game): void
}
