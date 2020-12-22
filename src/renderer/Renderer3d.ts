import { vec3 } from 'gl-matrix'
import { quat } from 'gl-matrix'
import { vec4 } from 'gl-matrix'
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
uniform mat4 world2view;

varying lowp vec4 vColor;

void main() {
  gl_Position = projection * world2view * model2world * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}
`

const fragmentShaderSrc = `
varying lowp vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`

export interface DebugLineModel {
  points: Float32Array
  color: vec4
}

export class Renderer3d {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext
  private program: WebGLProgram
  private viewportDimensions: vec2

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

    this.viewportDimensions = vec2.fromValues(
      this.canvas.width,
      this.canvas.height,
    )
    this.setViewportDimensions(this.viewportDimensions)
  }

  clear(_: string): void {
    this.ctx.clearColor(0.0, 0.0, 0.0, 1.0)
    this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
  }

  getViewportDimension(): Immutable<vec2> {
    return this.viewportDimensions
  }

  getFov(): number {
    return (75 * Math.PI) / 180
  }

  getFocalLength(): number {
    return 1 / Math.tan(this.getFov() / 2)
  }

  setViewportDimensions(d: Immutable<vec2>): void {
    this.viewportDimensions = vec2.clone(d)

    // Update gl viewport
    this.ctx.viewport(0, 0, d[0], d[1])

    // Update projection matrix
    const projection = mat4.perspective(
      mat4.create(),
      this.getFov(),
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

  setWvTransform(w2v: mat4): void {
    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'world2view'),
      false,
      w2v,
    )
  }

  /**
   * Translate a screenspace position (relative to the upper-left corner of the
   * viewport) to a viewspace position. The absolute value of the z-distance of
   * this point is equivalent to the focal length.
   *
   * See: "Picking", chapter 6.6 Van Verth and Bishop, 2nd ed.
   */
  screenToView(screenPos: Immutable<vec2>): vec3 {
    const w = this.viewportDimensions[0]
    const h = this.viewportDimensions[1]

    return vec3.fromValues(
      (2 * (screenPos[0] - w / 2)) / h,
      (-2 * (screenPos[1] - h / 2)) / h,
      -this.getFocalLength(),
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

  /**
   * Draws a sequence of lines, all of the same color. `srcVerts` should be a
   * set of point pairs, with each point described by three contiguous floats.
   */
  drawLines(srcVerts: Float32Array, color: vec4): void {
    const posAttrib = this.ctx.getAttribLocation(
      this.program,
      'aVertexPosition',
    )
    const colorAttrib = this.ctx.getAttribLocation(this.program, 'aVertexColor')
    const numPoints = srcVerts.length / 3

    // Make a color buffer in memory
    const srcColors = new Float32Array(4 * numPoints)
    for (let i = 0; i < numPoints; i++) {
      for (let j = 0; j < 4; j++) {
        srcColors[i * 4 + j] = color[j]
      }
    }

    // Start a new VAO
    const vao = this.ctx.createVertexArray()
    if (vao === null) {
      throw new Error('could not create vertex array')
    }
    this.ctx.bindVertexArray(vao)

    // Setup position array
    const posGlBuffer = this.ctx.createBuffer()
    if (posGlBuffer === null) {
      throw new Error('could not create buffer')
    }
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, posGlBuffer)
    this.ctx.enableVertexAttribArray(posAttrib)
    this.ctx.vertexAttribPointer(posAttrib, 3, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, srcVerts, this.ctx.STATIC_DRAW)

    // Setup vertex color buffer
    // TODO: we should use a different shader program that just lets us set
    // color as a frag shader uniform.
    const colorGlBuffer = this.ctx.createBuffer()
    if (colorGlBuffer === null) {
      throw new Error('could not create buffer')
    }
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, colorGlBuffer)
    this.ctx.enableVertexAttribArray(colorAttrib)
    this.ctx.vertexAttribPointer(colorAttrib, 4, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, srcColors, this.ctx.STATIC_DRAW)

    // Our VAO is ready...set uniforms and execute the draw.
    this.ctx.uniformMatrix4fv(
      this.ctx.getUniformLocation(this.program, 'model2world'),
      false,
      mat4.create(),
    )
    this.ctx.drawArrays(this.ctx.LINES, 0, numPoints)

    // Unbind our objects and delete them
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)
    this.ctx.deleteVertexArray(vao)
    this.ctx.deleteBuffer(posGlBuffer)
    this.ctx.deleteBuffer(colorGlBuffer)
  }
}
