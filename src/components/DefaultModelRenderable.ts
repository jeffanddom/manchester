import { IRenderable } from '~/components/IRenderable'
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
      worldTransform: e.transform!.mwTransform(),
    })
  }
}
