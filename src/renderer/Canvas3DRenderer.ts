import { mat3 } from 'gl-matrix'
import { mat2d, vec2 } from 'gl-matrix'

import { IRenderer, Primitive, Renderable } from '~/renderer/interfaces'

const gl = WebGL2RenderingContext

const colorTable: { [key: string]: [number, number, number] } = {
  red: [1.0, 0.0, 0.0],
  magenta: [1.0, 0.0, 1.0],
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
uniform mat3 uXform;

varying lowp vec4 vColor;

void main() {
  vec3 p = uXform * vec3(aVertexPosition, 1.0);
  gl_Position = vec4(p, 1.0);
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
  private cameraWorldPos: vec2
  private program: WebGLProgram
  private terrainVao: WebGLVertexArrayObject
  private terrainNumVerts: number

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('webgl2')!
    this.cameraWorldPos = vec2.create()

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

    this.terrainVao = this.ctx.createVertexArray()!
    this.terrainNumVerts = 0
  }

  clear(_: string): void {
    this.ctx.clearColor(1.0, 0.0, 1.0, 1.0)
    this.ctx.clear(gl.COLOR_BUFFER_BIT)
  }

  setTransform(_: mat2d): void {
    throw new Error('does not work')
  }

  setCameraWorldPos(p: vec2): void {
    this.cameraWorldPos = p

    // 1. Treats the camera position as the origin
    const w2v = mat2d.fromTranslation(
      mat2d.create(),
      vec2.negate(vec2.create(), this.cameraWorldPos),
    )

    // 2. Reverse the y-axis
    const flipY = mat2d.fromValues(1, 0, 0, -1, 0, 0)

    // 3. Normalize by size of viewport
    const normViewport = mat2d.fromValues(
      1 / (0.5 * this.canvas.width),
      0,
      0,
      1 / (0.5 * this.canvas.height),
      0,
      0,
    )

    const xform = w2v
    mat2d.multiply(xform, flipY, xform)
    mat2d.multiply(xform, normViewport, xform)

    this.ctx.uniformMatrix3fv(
      this.ctx.getUniformLocation(this.program, 'uXform'),
      false,
      mat3.fromMat2d(mat3.create(), xform),
    )
  }

  setGlobalOpacity(_: number): void {
    // this.ctx.globalAlpha = alpha
  }

  loadTerrain(renderables: Renderable[]): void {
    const positions: number[] = []
    const colors: number[] = []

    for (const r of renderables) {
      switch (r.primitive) {
        case Primitive.RECT:
          const nw = r.pos
          const ne = [r.pos[0] + r.dimensions[0], r.pos[1]]
          const sw = [r.pos[0], r.pos[1] + r.dimensions[1]]
          const se = [r.pos[0] + r.dimensions[0], r.pos[1] + r.dimensions[1]]

          // prettier-ignore
          positions.push(
            ...nw, ...se, ...ne,
            ...nw, ...sw, ...se,
          )

          const c = colorTable[r.fillStyle ?? 'magenta']

          // prettier-ignore
          colors.push(
            ...c, ...c, ...c,
            ...c, ...c, ...c,
          )
          break

        default:
          throw new Error('terrain must be rects')
      }
    }

    this.terrainNumVerts = positions.length / 2

    const aVertexPosition = this.ctx.getAttribLocation(
      this.program,
      'aVertexPosition',
    )
    const aVertexColor = this.ctx.getAttribLocation(
      this.program,
      'aVertexColor',
    )

    // Create terrain-specific VAO
    this.ctx.bindVertexArray(this.terrainVao)

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
      new Float32Array(colors),
      this.ctx.STATIC_DRAW,
    )

    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)
  }

  renderTerrain(): void {
    this.ctx.bindVertexArray(this.terrainVao)
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.terrainNumVerts)
  }

  render(_: Renderable): void {
    // TODO
  }
}
