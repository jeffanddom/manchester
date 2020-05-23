import { path2 } from '~/path2'
import { IEntity } from '~/entities/interfaces'
import { IPathRenderable } from '~/entities/components/interfaces'

export class PathRenderable implements IPathRenderable {
  path: path2
  fillStyle: string

  constructor(path: path2, fillStyle: string) {
    this.path = path
    this.fillStyle = fillStyle
  }

  render(e: IEntity, ctx: CanvasRenderingContext2D): void {
    const p = path2.translate(
      path2.rotate(this.path, e.transform.orientation),
      e.transform.position,
    )

    ctx.fillStyle = this.fillStyle
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
