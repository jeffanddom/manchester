import { vec2, mat2d } from 'gl-matrix'

import { path2 } from '~/path2'
import { IEntity } from '~/entities/interfaces'
import { IPathRenderable } from '~/entities/components/interfaces'
import { Camera } from '~/Camera'

export class PathRenderable implements IPathRenderable {
  path: path2
  fillStyle: string

  constructor(path: path2, fillStyle: string) {
    this.path = path
    this.fillStyle = fillStyle
  }

  render(e: IEntity, ctx: CanvasRenderingContext2D, camera: Camera): void {
    const transform = mat2d.multiply(
      mat2d.create(),
      camera.wvTransform(),
      e.transform.mwTransform(),
    )
    const p = this.path.map((p) =>
      vec2.transformMat2d(vec2.create(), p, transform),
    )

    ctx.fillStyle = this.fillStyle
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
