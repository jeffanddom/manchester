import { vec3 } from 'gl-matrix'
import { quat } from 'gl-matrix'
import { mat4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import { Model } from '~/models'
import { Immutable } from '~/types/immutable'

const gl = WebGL2RenderingContext

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

  private vaos: {
    [key: string]: {
      vao: WebGLVertexArrayObject
      numVerts: number
      primitive: string
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('webgl2')!
    this.cameraWorldPos = vec3.create()

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

    this.ctx.enable(this.ctx.DEPTH_TEST)
    this.ctx.enable(this.ctx.CULL_FACE)
    this.ctx.cullFace(this.ctx.BACK)
    this.ctx.frontFace(this.ctx.CCW)

    this.vaos = {}

    this.setViewportDimensions(
      vec2.fromValues(this.canvas.width, this.canvas.height),
    )
  }

  clear(_: string): void {
    this.ctx.clearColor(0.0, 0.0, 0.0, 1.0)
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
  }

  setViewportDimensions(d: vec2): void {
    this.canvas.width = d[0]
    this.canvas.height = d[1]
    this.ctx.viewport(0, 0, d[0], d[1])

    // Set projection matrix
    const projection = mat4.perspective(
      mat4.create(),
      (75 * Math.PI) / 180,
      d[0] / d[1],
      0.1,
      64,
    )
    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'projection'),
      false,
      projection,
    )
  }

  setCameraWorldPos(p: vec2): void {
    this.cameraWorldPos = vec3.fromValues(p[0], 7.0, p[1] + 4)

    // Move camera in world space
    const v2w = mat4.fromRotationTranslation(
      mat4.create(),
      quat.fromEuler(quat.create(), -60, 0, 0),
      this.cameraWorldPos,
    )
    const w2v = mat4.invert(mat4.create(), v2w)

    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'uXform'),
      false,
      w2v,
    )
  }

  loadModel(key: string, model: Model): void {
    const numVerts = model.vertices.length / 3

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
      model.vertices,
      this.ctx.STATIC_DRAW,
    )

    // Colors
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(aVertexColor)
    this.ctx.vertexAttribPointer(aVertexColor, 4, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      new Float32Array(model.colors),
      this.ctx.STATIC_DRAW,
    )

    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)

    // Set VAO
    this.vaos[key] = {
      vao,
      numVerts,
      primitive: model.primitive,
    }
  }

  drawModel(key: string, pos: Immutable<vec2>, orientation: number): void {
    if (this.vaos[key] === undefined) {
      return
    }

    const vao = this.vaos[key]
    this.ctx.bindVertexArray(vao.vao)

    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'model2world'),
      false,
      mat4.fromRotationTranslation(
        mat4.create(),
        quat.fromEuler(quat.create(), 0, (-orientation * 180) / Math.PI, 0),
        vec3.fromValues(pos[0], 0, pos[1]),
      ),
    )

    let primitive
    switch (vao.primitive) {
      case 'TRIANGLES':
        primitive = this.ctx.TRIANGLES
        break
      case 'LINES':
        primitive = this.ctx.LINES
        break
      default:
        throw new Error(`invalid primitive: ${vao.primitive}`)
    }

    this.ctx.drawArrays(primitive, 0, vao.numVerts)
  }
}
