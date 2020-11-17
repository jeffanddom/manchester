import { mat2d, vec2 } from 'gl-matrix'

import {
  IRenderer,
  Primitive,
  Renderable,
  TextAlign,
} from '~/renderer/interfaces'
import { transformCircle } from '~/util/math'

const gl = WebGL2RenderingContext

const colors = {
  red: [1.0, 0.0, 0.0, 1.0],
  black: [0.0, 0.0, 0.0, 1.0],
  yellow: [1.0, 1.0, 0.0, 1.0],
  green: [0.0, 1.0, 0.0, 1.0],
  forestgreen: [0.0, 1.0, 0.0, 1.0],
  darkgreen: [0.0, 1.0, 0.0, 1.0],
  blue: [0.0, 0.0, 1.0, 1.0],
  brown: [0.65, 0.16, 0.16, 1.0],
}

const vertexShaderSrc = `
attribute vec2 aVertexPosition;

void main() {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
`

const fragmentShaderSrc = `
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`

export class Canvas3DRenderer implements IRenderer {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext
  private transform: mat2d

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('webgl2')!
    this.transform = mat2d.identity(mat2d.create())

    this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height)

    const vertexShader = this.ctx.createShader(gl.VERTEX_SHADER)!
    this.ctx.shaderSource(vertexShader, vertexShaderSrc)
    this.ctx.compileShader(vertexShader)

    const fragmentShader = this.ctx.createShader(gl.FRAGMENT_SHADER)!
    this.ctx.shaderSource(fragmentShader, fragmentShaderSrc)
    this.ctx.compileShader(fragmentShader)

    const program = this.ctx.createProgram()!
    this.ctx.attachShader(program, vertexShader)
    this.ctx.attachShader(program, fragmentShader)
    this.ctx.linkProgram(program)
    this.ctx.useProgram(program)

    this.ctx.uniform4fv(
      this.ctx.getUniformLocation(program, 'uColor'),
      colors.blue,
    )

    const aVertexPosition = this.ctx.getAttribLocation(
      program,
      'aVertexPosition',
    )
    this.ctx.enableVertexAttribArray(aVertexPosition)
    this.ctx.vertexAttribPointer(
      aVertexPosition,
      2,
      this.ctx.FLOAT,
      false,
      0,
      0,
    )
  }

  clear(_: string): void {
    this.ctx.clearColor(1.0, 0, 1.0, 1.0)
    this.ctx.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  setTransform(t: mat2d): void {
    this.transform = mat2d.clone(t)
  }

  setGlobalOpacity(_: number): void {
    // this.ctx.globalAlpha = alpha
  }

  render(r: Renderable): void {
    const aspect = this.canvas.width / this.canvas.height
    const vertices = new Float32Array([
      // Triangle 1
      -0.5,
      0.5 * aspect,
      0.5,
      0.5 * aspect,
      0.5,
      -0.5 * aspect,
      // Triangle 2
      -0.5,
      0.5 * aspect,
      0.5,
      -0.5 * aspect,
      -0.5,
      -0.5 * aspect,
    ])

    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, vertices, this.ctx.STATIC_DRAW)

    const numItems = vertices.length / 2
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, numItems)

    switch (r.primitive) {
      // case Primitive.PATH:
      //   {
      //     this.ctx.fillStyle = r.fillStyle
      //     const transform = mat2d.multiply(
      //       mat2d.create(),
      //       this.transform,
      //       r.mwTransform,
      //     )
      //     const p = r.path.map((p) =>
      //       vec2.floor(
      //         vec2.create(),
      //         vec2.transformMat2d(vec2.create(), p, transform),
      //       ),
      //     )
      //     this.ctx.beginPath()
      //     this.ctx.moveTo(p[0][0], p[0][1])
      //     for (let i = 1; i < p.length; i++) {
      //       this.ctx.lineTo(p[i][0], p[i][1])
      //     }
      //     this.ctx.fill()
      //   }
      //   break
      case Primitive.RECT:
        {
          // if (r.fillStyle !== undefined) {
          //   this.ctx.fillStyle = r.fillStyle
          // }
          // if (r.strokeStyle !== undefined) {
          //   this.ctx.lineWidth = 1
          //   this.ctx.strokeStyle = r.strokeStyle
          // }
          // const vmin = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
          // const vmax = vec2.transformMat2d(
          //   vec2.create(),
          //   vec2.add(vec2.create(), r.pos, r.dimensions),
          //   this.transform,
          // )
          // vec2.floor(vmin, vmin)
          // vec2.floor(vmax, vmax)
          // const d = vec2.sub(vec2.create(), vmax, vmin)
          // if (r.fillStyle !== undefined) {
          //   this.ctx.fillRect(vmin[0], vmin[1], d[0], d[1])
          // }
          // if (r.strokeStyle !== undefined) {
          //   this.ctx.strokeRect(vmin[0], vmin[1], d[0], d[1])
          // }
        }
        break
      // case Primitive.CIRCLE:
      //   {
      //     const transformed = transformCircle(
      //       { pos: r.pos, radius: r.radius },
      //       this.transform,
      //     )
      //     this.ctx.fillStyle = r.fillStyle
      //     this.ctx.beginPath()
      //     this.ctx.arc(
      //       Math.floor(transformed.pos[0]),
      //       Math.floor(transformed.pos[1]),
      //       Math.floor(transformed.radius),
      //       0,
      //       Math.PI * 2,
      //     )
      //     this.ctx.fill()
      //   }
      //   break
      // case Primitive.LINE:
      //   {
      //     const vfrom = vec2.transformMat2d(
      //       vec2.create(),
      //       r.from,
      //       this.transform,
      //     )
      //     const vto = vec2.transformMat2d(vec2.create(), r.to, this.transform)
      //     // remove aliasing artifacts (may not look good for non horizontal/vertical lines?)
      //     vec2.floor(vfrom, vfrom)
      //     vec2.floor(vto, vto)
      //     vec2.add(vfrom, vfrom, [0.5, 0.5])
      //     vec2.add(vto, vto, [0.5, 0.5])
      //     this.ctx.strokeStyle = r.style
      //     this.ctx.lineWidth = r.width
      //     this.ctx.beginPath()
      //     this.ctx.moveTo(vfrom[0], vfrom[1])
      //     this.ctx.lineTo(vto[0], vto[1])
      //     this.ctx.stroke()
      //   }
      //   break
      // case Primitive.TEXT:
      //   {
      //     switch (r.hAlign) {
      //       case TextAlign.Min:
      //         this.ctx.textAlign = 'left'
      //         break
      //       case TextAlign.Center:
      //         this.ctx.textAlign = 'center'
      //         break
      //       case TextAlign.Max:
      //         this.ctx.textAlign = 'right'
      //         break
      //     }
      //     switch (r.vAlign) {
      //       case TextAlign.Min:
      //         this.ctx.textBaseline = 'top'
      //         break
      //       case TextAlign.Center:
      //         this.ctx.textBaseline = 'middle'
      //         break
      //       case TextAlign.Max:
      //         this.ctx.textBaseline = 'alphabetic'
      //         break
      //     }
      //     this.ctx.font = r.font
      //     this.ctx.fillStyle = r.style
      //     const vpos = vec2.transformMat2d(vec2.create(), r.pos, this.transform)
      //     this.ctx.fillText(r.text, vpos[0], vpos[1])
      //   }
      //   break
    }
  }
}
