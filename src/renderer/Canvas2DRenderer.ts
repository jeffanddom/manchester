import { Primitive, Renderable, IRenderer } from '~/renderer/interfaces'
import { vec2, mat2d } from 'gl-matrix'

export class Canvas2DRenderer implements IRenderer {
  private ctx: CanvasRenderingContext2D
  private transform: mat2d

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.transform = mat2d.identity(mat2d.create())
  }

  clear(color: string): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  setTransform(t: mat2d): void {
    this.transform = mat2d.clone(t)
  }

  render(r: Renderable): void {
    switch (r.primitive) {
      case Primitive.PATH: {
        this.ctx.fillStyle = r.fillStyle

        const transform = mat2d.multiply(
          mat2d.create(),
          this.transform,
          r.mwTransform,
        )
        const p = r.path.map((p) =>
          vec2.transformMat2d(vec2.create(), p, transform),
        )
        this.ctx.beginPath()
        this.ctx.moveTo(p[0][0], p[0][1])
        for (let i = 1; i < p.length; i++) {
          this.ctx.lineTo(p[i][0], p[i][1])
        }
        this.ctx.fill()
        break
      }

      case Primitive.RECT: {
        if (r.fillStyle !== undefined) {
          this.ctx.fillStyle = r.fillStyle
        }
        if (r.strokeStyle !== undefined) {
          this.ctx.strokeStyle = r.strokeStyle
        }

        const vmin = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
        const vmax = vec2.transformMat2d(
          vec2.create(),
          vec2.add(vec2.create(), r.pos, r.dimensions),
          this.transform,
        )

        if (r.floor) {
          vec2.floor(vmin, vmin)
          vec2.floor(vmax, vmax)
        }

        const d = vec2.sub(vec2.create(), vmax, vmin)

        if (r.fillStyle !== undefined) {
          this.ctx.fillRect(vmin[0], vmin[1], d[0], d[1])
        }
        if (r.strokeStyle !== undefined) {
          this.ctx.strokeRect(vmin[0], vmin[1], d[0], d[1])
        }
        break
      }

      case Primitive.CIRCLE: {
        this.ctx.fillStyle = r.fillStyle

        const vp = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
        const edgep = vec2.transformMat2d(
          vec2.create(),
          vec2.add(vec2.create(), r.pos, vec2.fromValues(r.radius, 0)),
          this.transform,
        )

        this.ctx.beginPath()
        this.ctx.arc(vp[0], vp[1], edgep[0] - vp[0], 0, Math.PI * 2)
        this.ctx.fill()
        break
      }

      case Primitive.LINE: {
        const vfrom = vec2.transformMat2d(vec2.create(), r.from, this.transform)
        const vto = vec2.transformMat2d(vec2.create(), r.to, this.transform)

        // remove aliasing artifacts (may not look good for non horizontal/vertical lines?)
        vec2.floor(vfrom, vfrom)
        vec2.floor(vto, vto)
        vec2.add(vfrom, vfrom, [0.5, 0.5])
        vec2.add(vto, vto, [0.5, 0.5])

        this.ctx.strokeStyle = r.style
        this.ctx.lineWidth = r.width

        this.ctx.beginPath()
        this.ctx.moveTo(vfrom[0], vfrom[1])
        this.ctx.lineTo(vto[0], vto[1])
        this.ctx.stroke()
      }
    }
  }
}
