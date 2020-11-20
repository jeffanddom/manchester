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
  red: [1.0, 0.0, 0.0],
  black: [0.0, 0.0, 0.0],
  yellow: [1.0, 1.0, 0.0],
  green: [0.0, 1.0, 0.0],
  forestgreen: [0.0, 1.0, 0.0],
  darkgreen: [0.0, 1.0, 0.0],
  blue: [0.0, 0.0, 1.0],
  brown: [0.65, 0.16, 0.1],
}

const vertexShaderSrc = `
attribute vec2 aVertexPosition;
attribute vec3 aVertexColor;

varying lowp vec4 vColor;

void main() {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
  vColor = vec4(aVertexColor, 1.0);
}
`

const fragmentShaderSrc = `
varying lowp vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`

export class Canvas3DRenderer implements IRenderer {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext
  private transform: mat2d
  private program: WebGLProgram

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
    this.program = program
  }

  clear(_: string): void {
    this.ctx.clearColor(1.0, 0.0, 1.0, 1.0)
    this.ctx.clear(gl.COLOR_BUFFER_BIT)
  }

  setTransform(t: mat2d): void {
    this.transform = mat2d.clone(t)
  }

  setGlobalOpacity(_: number): void {
    // this.ctx.globalAlpha = alpha
  }

  render(r: Renderable): void {
    const aspect = this.canvas.width / this.canvas.height
    const squares = [
      [
        [0.5, 0.5],
        [-0.5, 0.5],
        [0.5, -0.5],
        [-0.5, -0.5],
      ],
    ]
    const squareColors = [colors.green]

    const positions = []
    const vertexColors = []

    for (let i = 0; i < squares.length; i++) {
      const square = squares[i]
      const color = squareColors[i]

      for (let j = 0; j < square.length; j++) {
        positions.push(square[j][0], square[j][1] * aspect)
        vertexColors.push(...color)
      }
    }

    const aVertexPosition = this.ctx.getAttribLocation(
      this.program,
      'aVertexPosition',
    )
    const aVertexColor = this.ctx.getAttribLocation(
      this.program,
      'aVertexColor',
    )

    // Vertices
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(aVertexPosition)
    this.ctx.vertexAttribPointer(
      aVertexPosition,
      2,
      this.ctx.FLOAT,
      false,
      0,
      0,
    )

    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      new Float32Array(positions),
      this.ctx.STATIC_DRAW,
    )

    // Colors
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(aVertexColor)
    this.ctx.vertexAttribPointer(aVertexColor, 3, this.ctx.FLOAT, false, 0, 0)

    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      new Float32Array(vertexColors),
      this.ctx.STATIC_DRAW,
    )

    // Draw stuff
    const numItems = positions.length / 2
    this.ctx.drawArrays(this.ctx.TRIANGLE_STRIP, 0, numItems)
  }
}
