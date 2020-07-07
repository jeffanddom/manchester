import { vec2 } from 'gl-matrix'

import { IRenderable } from '~/entities/components/interfaces'
import { Entity } from '~/entities/Entity'
import { Primitive, Renderable } from '~/renderer/interfaces'

export class PathRenderable implements IRenderable {
  path: Array<vec2>
  fillStyle: string

  constructor(path: Array<vec2>, fillStyle: string) {
    this.path = path
    this.fillStyle = fillStyle
  }

  setFillStyle(s: string): void {
    this.fillStyle = s
  }

  getRenderables(e: Entity): Renderable[] {
    return [
      {
        primitive: Primitive.PATH,
        fillStyle: this.fillStyle,
        mwTransform: e.transform!.mwTransform(),
        path: this.path,
      },
    ]
  }
}
