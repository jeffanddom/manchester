import { IRenderable } from '~/entities/components/interfaces'
import { IEntity } from '~/entities/interfaces'
import { Primitive, Renderable } from '~renderer/interfaces'
import { path2 } from '~util/path2'

export class PathRenderable implements IRenderable {
  path: path2
  fillStyle: string

  constructor(path: path2, fillStyle: string) {
    this.path = path
    this.fillStyle = fillStyle
  }

  setFillStyle(s: string): void {
    this.fillStyle = s
  }

  getRenderables(e: IEntity): Renderable[] {
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
