import { IRenderable } from '~/components/IRenderable'
import * as transform from '~/components/transform'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { Model, toRenderables } from '~/Model'
import { Renderable } from '~/renderer/interfaces'

export class DefaultModelRenderable implements IRenderable {
  model: Model

  constructor(model: Model) {
    this.model = model
  }

  getRenderables(
    entityManager: EntityManager,
    entityId: EntityId,
  ): Renderable[] {
    const t = entityManager.transforms.get(entityId)!
    return toRenderables(this.model, {
      worldTransform: transform.toMWTransform(t),
    })
  }
}
