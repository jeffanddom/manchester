import { path2 } from '~/path2'
import { vec2, mat2d } from 'gl-matrix'

export enum Type {
  PATH = 0,
  RECT = 1,
  CIRCLE = 2,
  LINE = 3,
}

export interface Path {
  type: Type.PATH
  fillStyle: string

  mwTransform: mat2d
  path: path2 // modelspace coordinates
}

export interface Rect {
  type: Type.RECT
  fillStyle?: string
  strokeStyle?: string

  floor: boolean // whether to align to whole pixels
  pos: vec2 // worldspace coordinates
  dimensions: vec2
}

export interface Circle {
  type: Type.CIRCLE
  fillStyle: string

  pos: vec2 // worldspace coordinates
  radius: number
}

export interface Line {
  type: Type.LINE
  style: string
  from: vec2
  to: vec2
  width: number
}

export type Renderable = Path | Rect | Circle | Line

export const render = (
  ctx: CanvasRenderingContext2D,
  r: Renderable,
  wvTransform: mat2d,
): void => {
  switch (r.type) {
    case Type.PATH: {
      ctx.fillStyle = r.fillStyle

      const transform = mat2d.multiply(
        mat2d.create(),
        wvTransform,
        r.mwTransform,
      )
      const p = r.path.map((p) =>
        vec2.transformMat2d(vec2.create(), p, transform),
      )
      ctx.beginPath()
      ctx.moveTo(p[0][0], p[0][1])
      for (let i = 1; i < p.length; i++) {
        ctx.lineTo(p[i][0], p[i][1])
      }
      ctx.fill()
      break
    }

    case Type.RECT: {
      if (r.fillStyle !== undefined) {
        ctx.fillStyle = r.fillStyle
      }
      if (r.strokeStyle !== undefined) {
        ctx.strokeStyle = r.strokeStyle
      }

      const vmin = vec2.transformMat2d(vec2.create(), r.pos, wvTransform)
      const vmax = vec2.transformMat2d(
        vec2.create(),
        vec2.add(vec2.create(), r.pos, r.dimensions),
        wvTransform,
      )

      if (r.floor) {
        vec2.floor(vmin, vmin)
        vec2.floor(vmax, vmax)
      }

      const d = vec2.sub(vec2.create(), vmax, vmin)

      if (r.fillStyle !== undefined) {
        ctx.fillRect(vmin[0], vmin[1], d[0], d[1])
      }
      if (r.strokeStyle !== undefined) {
        ctx.strokeRect(vmin[0], vmin[1], d[0], d[1])
      }
      break
    }

    case Type.CIRCLE: {
      ctx.fillStyle = r.fillStyle

      const vp = vec2.transformMat2d(vec2.create(), r.pos, wvTransform)
      const edgep = vec2.transformMat2d(
        vec2.create(),
        vec2.add(vec2.create(), r.pos, vec2.fromValues(r.radius, 0)),
        wvTransform,
      )

      ctx.beginPath()
      ctx.arc(vp[0], vp[1], edgep[0] - vp[0], 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case Type.LINE: {
      const vfrom = vec2.transformMat2d(vec2.create(), r.from, wvTransform)
      const vto = vec2.transformMat2d(vec2.create(), r.to, wvTransform)

      // remove aliasing artifacts (may not look good for non horizontal/vertical lines?)
      vec2.floor(vfrom, vfrom)
      vec2.floor(vto, vto)
      vec2.add(vfrom, vfrom, [0.5, 0.5])
      vec2.add(vto, vto, [0.5, 0.5])

      ctx.strokeStyle = r.style
      ctx.lineWidth = r.width

      ctx.beginPath()
      ctx.moveTo(vfrom[0], vfrom[1])
      ctx.lineTo(vto[0], vto[1])
      ctx.stroke()
    }
  }
}
