import { path2 } from '~/path2'
import { vec2, mat2d } from 'gl-matrix'

export enum Type {
  PATH = 0,
  RECT = 1,
  // CIRCLE = 2,
}

export interface Path {
  type: Type.PATH
  fillStyle: string

  mwTransform: mat2d
  path: path2 // modelspace coordinates
}

export interface Rect {
  type: Type.RECT
  fillStyle: string

  floor: boolean // whether to align to whole pixels
  pos: vec2 // worldspace coordinates
  dimensions: vec2
}

// export interface Circle {
//   type: Type.CIRCLE
//   fillStyle: string

//   pos: vec2 // worldspace coordinates
//   radius: number
// }

export type Renderable = Path | Rect //| Circle

export const render = (
  ctx: CanvasRenderingContext2D,
  r: Renderable,
  wvTransform: mat2d,
): void => {
  ctx.fillStyle = r.fillStyle

  switch (r.type) {
    case Type.PATH: {
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

      ctx.fillRect(vmin[0], vmin[1], vmax[0] - vmin[0], vmax[1] - vmin[1])
      break
    }

    // case Type.CIRCLE:
    //   break
  }
}
