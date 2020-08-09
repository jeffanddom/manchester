import { Transform } from './Transform'

import { Team } from '~/components/team'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Renderable } from '~/renderer/interfaces'

export interface IRenderable {
  getRenderables(e: Entity): Renderable[]
}

export interface IMotionScript {
  update(t: Transform, entityId: string, g: Game, dt: number): void
}

export interface IShooterScript {
  update(t: Transform, team: Team, entityId: string, g: Game, dt: number): void
}
