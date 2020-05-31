import { path2 } from '~/path2'
import { IEntity } from '~/entities/interfaces'
import { IRenderable } from '~/entities/components/interfaces'
import { Renderable, Primitive } from '~renderer/interfaces'

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

  getRenderable(e: IEntity): Renderable {
    return {
      primitive: Primitive.PATH,
      fillStyle: this.fillStyle,
      mwTransform: e.transform.mwTransform(),
      path: this.path,
    }
  }
}
