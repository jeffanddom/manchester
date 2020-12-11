import { vec3 } from 'gl-matrix'
import { quat } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
import { mat4 } from 'gl-matrix'
import { mat2d, vec2 } from 'gl-matrix'

import { Primitive, Renderable } from '~/renderer/interfaces'
import { Immutable } from '~/types/immutable'

const gl = WebGL2RenderingContext

const colorTable: { [key: string]: [number, number, number] } = {
  red: [1.0, 0.0, 0.0],
  magenta: [1.0, 0.0, 1.0],
  black: [0.0, 0.0, 0.0],
  yellow: [1.0, 1.0, 0.0],
  green: [0.0, 1.0, 0.0],
  forestgreen: [0.2, 0.8, 0.1],
  darkgreen: [0.0, 1.0, 0.0],
  blue: [0.0, 0.0, 1.0],
  brown: [0.65, 0.16, 0.1],
  grey: [0.33, 0.33, 0.33],
}

const vertexShaderSrc = `
attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;
uniform mat4 model2world;
uniform mat4 projection;
uniform mat4 uXform;

varying lowp vec4 vColor;

void main() {
  gl_Position = projection * uXform * model2world * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}
`

const fragmentShaderSrc = `
varying lowp vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`

export class Canvas3DRenderer {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext
  private cameraWorldPos: vec3
  private program: WebGLProgram
  
  private vaos: {[key: string]: {
    vao: WebGLVertexArrayObject
    numVerts: number
  }}
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('webgl2')!
    this.cameraWorldPos = vec3.create()

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

    this.vaos = {}

    // Set projection matrix
    const projection = mat4.perspective(mat4.create(), 
      90 * Math.PI / 180,
      canvas.width / canvas.height,
      0.1,
      10000
    )
    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'projection'),
      false,
      projection
    )
  }

  clear(_: string): void {
    this.ctx.clearColor(0.0, 0.0, 0.0, 1.0)
    this.ctx.clear(gl.COLOR_BUFFER_BIT)
  }

  setTransform(_: mat2d): void {
    throw new Error('does not work')
  }

  setCameraWorldPos(p: vec2): void {
    this.cameraWorldPos = vec3.fromValues(p[0], -p[1] - 250, 300.0)

    // prettier-ignore
    const flipY = mat4.fromValues(
      1,  0, 0, 0,
      0, -1, 0, 0,
      0,  0, 1, 0,
      0,  0, 0, 1
    )

    // 1. Move camera in world space
    const v2w = mat4.fromRotationTranslation(
      mat4.create(),
      quat.fromEuler(quat.create(), 45, 0, 0),
      this.cameraWorldPos,
    )
    const w2v = mat4.invert(mat4.create(), v2w)

    // 2. Reverse the y-axis
    const xform = mat4.multiply(mat4.create(), w2v, flipY)

    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'uXform'),
      false,
      xform,
    )
  }
  loadModel(key: string, vertices: Float32Array, colors: Float32Array): void {
    const numVerts = vertices.length / 3

    const aVertexPosition = this.ctx.getAttribLocation(
      this.program,
      'aVertexPosition',
    )
    const aVertexColor = this.ctx.getAttribLocation(
      this.program,
      'aVertexColor',
    )

    // Create terrain-specific VAO
    const vao = this.ctx.createVertexArray()!
    this.ctx.bindVertexArray(vao)

    // Vertices
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(aVertexPosition)
    this.ctx.vertexAttribPointer(
      aVertexPosition,
      3,
      this.ctx.FLOAT,
      false,
      0,
      0,
    )
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      vertices,
      this.ctx.STATIC_DRAW,
    )

    // Colors
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(aVertexColor)
    this.ctx.vertexAttribPointer(aVertexColor, 4, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      new Float32Array(colors),
      this.ctx.STATIC_DRAW,
    )

    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)

    // Set VAO
    this.vaos[key] = {
      vao,
      numVerts
    }
  }

  drawModel(key: string, pos: Immutable<vec2>) {
    if (!this.vaos[key]) {
      return
    }

    const vao = this.vaos[key]
    this.ctx.bindVertexArray(vao.vao)

    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'model2world'),
      false,
      mat4.fromTranslation(mat4.create(), vec3.fromValues(pos[0], pos[1], 0))
    )

    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, vao.numVerts)
  }

  render(_: Renderable): void {
    // TODO
  }
}
