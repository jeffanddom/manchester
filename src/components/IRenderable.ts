import { Entity } from '~/entities/Entity'
import { Renderable } from '~/renderer/interfaces'

export interface IRenderable {
  getRenderables(e: Entity): Renderable[]
}
