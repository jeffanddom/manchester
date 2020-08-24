import { IRenderable } from '~/components/IRenderable'
import * as transform from '~/components/transform'
import { Entity } from '~/entities/Entity'
import { Model, toRenderables } from '~/Model'
import { Renderable } from '~/renderer/interfaces'

export class DefaultModelRenderable implements IRenderable {
  model: Model

  constructor(model: Model) {
    this.model = model
  }

  getRenderables(e: Entity): Renderable[] {
    return toRenderables(this.model, {
      worldTransform: transform.toMWTransform(e.transform!),
    })
  }
}
