import { mat2d, vec2 } from 'gl-matrix'

import { transformCircle } from '~/util/math'

export enum Primitive2d {
  PATH = 0,
  RECT = 1,
  CIRCLE = 2,
  LINE = 3,
  TEXT = 4,
}

export interface Path {
  primitive: Primitive2d.PATH
  fillStyle: string
  mwTransform: mat2d
  path: Array<vec2> // modelspace coordinates
}

export interface Rect {
  primitive: Primitive2d.RECT
  fillStyle?: string
  strokeStyle?: string
  pos: vec2 // worldspace coordinates
  dimensions: vec2
}

export interface Circle {
  primitive: Primitive2d.CIRCLE
  fillStyle: string
  pos: vec2 // worldspace coordinates
  radius: number
}

export interface Line {
  primitive: Primitive2d.LINE
  style: string
  from: vec2
  to: vec2
  width: number
}

export enum TextAlign {
  Min,
  Center,
  Max,
}

export interface Text {
  primitive: Primitive2d.TEXT
  style: string
  font: string
  pos: vec2
  text: string
  hAlign: TextAlign
  vAlign: TextAlign
}

export type Renderable2d = Path | Rect | Circle | Line | Text

export class Renderer2d {
  private ctx: CanvasRenderingContext2D
  private transform: mat2d

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.transform = mat2d.identity(mat2d.create())
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  setTransform(t: mat2d): void {
    this.transform = mat2d.clone(t)
  }

  setGlobalOpacity(alpha: number): void {
    this.ctx.globalAlpha = alpha
  }

  render(r: Renderable2d): void {
    switch (r.primitive) {
      case Primitive2d.PATH:
        {
          this.ctx.fillStyle = r.fillStyle

          const transform = mat2d.multiply(
            mat2d.create(),
            this.transform,
            r.mwTransform,
          )
          const p = r.path.map((p) =>
            vec2.floor(
              vec2.create(),
              vec2.transformMat2d(vec2.create(), p, transform),
            ),
          )
          this.ctx.beginPath()
          this.ctx.moveTo(p[0][0], p[0][1])
          for (let i = 1; i < p.length; i++) {
            this.ctx.lineTo(p[i][0], p[i][1])
          }
          this.ctx.fill()
        }
        break

      case Primitive2d.RECT:
        {
          if (r.fillStyle !== undefined) {
            this.ctx.fillStyle = r.fillStyle
          }
          if (r.strokeStyle !== undefined) {
            this.ctx.lineWidth = 1
            this.ctx.strokeStyle = r.strokeStyle
          }

          const vmin = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
          const vmax = vec2.transformMat2d(
            vec2.create(),
            vec2.add(vec2.create(), r.pos, r.dimensions),
            this.transform,
          )

          vec2.floor(vmin, vmin)
          vec2.floor(vmax, vmax)

          const d = vec2.sub(vec2.create(), vmax, vmin)

          if (r.fillStyle !== undefined) {
            this.ctx.fillRect(vmin[0], vmin[1], d[0], d[1])
          }
          if (r.strokeStyle !== undefined) {
            this.ctx.strokeRect(vmin[0], vmin[1], d[0], d[1])
          }
        }
        break

      case Primitive2d.CIRCLE:
        {
          const transformed = transformCircle(
            { pos: r.pos, radius: r.radius },
            this.transform,
          )

          this.ctx.fillStyle = r.fillStyle
          this.ctx.beginPath()
          this.ctx.arc(
            Math.floor(transformed.pos[0]),
            Math.floor(transformed.pos[1]),
            Math.floor(transformed.radius),
            0,
            Math.PI * 2,
          )
          this.ctx.fill()
        }
        break

      case Primitive2d.LINE:
        {
          const vfrom = vec2.transformMat2d(
            vec2.create(),
            r.from,
            this.transform,
          )
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
        break

      case Primitive2d.TEXT:
        {
          switch (r.hAlign) {
            case TextAlign.Min:
              this.ctx.textAlign = 'left'
              break
            case TextAlign.Center:
              this.ctx.textAlign = 'center'
              break
            case TextAlign.Max:
              this.ctx.textAlign = 'right'
              break
          }

          switch (r.vAlign) {
            case TextAlign.Min:
              this.ctx.textBaseline = 'top'
              break
            case TextAlign.Center:
              this.ctx.textBaseline = 'middle'
              break
            case TextAlign.Max:
              this.ctx.textBaseline = 'alphabetic'
              break
          }

          this.ctx.font = r.font
          this.ctx.fillStyle = r.style
          const vpos = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
          this.ctx.fillText(r.text, vpos[0], vpos[1])
        }
        break
    }
  }
}
