import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { Renderable } from '~/renderer/interfaces'

export interface IRenderable {
  getRenderables(entityManager: EntityManager, entityId: EntityId): Renderable[]
}
