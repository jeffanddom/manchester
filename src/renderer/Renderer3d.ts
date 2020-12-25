import { mat4, quat, vec2, vec3 } from 'gl-matrix'

import { Model as ModelDef } from '~/models'
import { shader as debugDrawShader } from '~/renderer/shaders/debugDraw'
import { shader as standardShader } from '~/renderer/shaders/standard'
import { Immutable } from '~/types/immutable'

const gl = WebGL2RenderingContext

export interface ShaderDefinition {
  vertexSrc: string
  fragmentSrc: string
  attribs: string[]
  uniforms: string[]
}

interface Shader {
  program: WebGLProgram
  attribs: Map<string, GLint>
  uniforms: Map<string, WebGLUniformLocation>
}

interface Model {
  vao: WebGLVertexArrayObject
  numVerts: number
  primitive: string
  shader: string
}

export enum RenderPass {
  Standard,
  DebugDraw,
}

export class Renderer3d {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext

  private shaders: Map<string, Shader>
  private models: Map<string, Model>

  private viewportDimensions: vec2
  private world2ViewTransform: mat4
  private currentShader: Shader | undefined

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.ctx = canvas.getContext('webgl2')!

    this.shaders = new Map()
    this.loadShader('standard', standardShader)
    this.loadShader('debugDraw', debugDrawShader)

    this.models = new Map()

    this.viewportDimensions = vec2.fromValues(
      this.canvas.width,
      this.canvas.height,
    )
    this.setViewportDimensions(this.viewportDimensions)

    this.world2ViewTransform = mat4.create()
    this.currentShader = undefined
  }

  private loadShader(name: string, def: ShaderDefinition): void {
    if (this.shaders.has(name)) {
      throw new Error(`shader ${name} already defined`)
    }

    const vertexShader = this.ctx.createShader(gl.VERTEX_SHADER)!
    this.ctx.shaderSource(vertexShader, def.vertexSrc)
    this.ctx.compileShader(vertexShader)

    const fragmentShader = this.ctx.createShader(gl.FRAGMENT_SHADER)!
    this.ctx.shaderSource(fragmentShader, def.fragmentSrc)
    this.ctx.compileShader(fragmentShader)

    const program = this.ctx.createProgram()!
    this.ctx.attachShader(program, vertexShader)
    this.ctx.attachShader(program, fragmentShader)
    this.ctx.linkProgram(program)

    const attribs = new Map()
    for (const a of def.attribs) {
      if (attribs.has(a)) {
        throw new Error(`shader ${name} attrib ${a} already defined`)
      }

      const loc = this.ctx.getAttribLocation(program, a)
      if (loc < 0) {
        throw new Error(`shader ${name} attrib ${a} not defined in source`)
      }

      attribs.set(a, loc)
    }

    const uniforms = new Map()
    for (const u of def.uniforms) {
      if (uniforms.has(u)) {
        throw new Error(`shader ${name} uniform ${u} already defined`)
      }

      const loc = this.ctx.getUniformLocation(program, u)
      if (loc === undefined) {
        throw new Error(`shader ${name} uniform ${u} not defined in source`)
      }

      uniforms.set(u, loc)
    }

    this.shaders.set(name, {
      program,
      attribs,
      uniforms,
    })
  }

  private useShader(name: string): void {
    this.currentShader = this.shaders.get(name)
    if (this.currentShader === undefined) {
      throw new Error(`shader ${name} not loaded`)
    }
    this.ctx.useProgram(this.currentShader.program)

    // Setup some common uniforms

    const projectionUniform = this.currentShader.uniforms.get('projection')
    if (projectionUniform === undefined) {
      throw new Error(`shader ${name} projection uniform undefined`)
    }

    this.ctx.uniformMatrix4fv(
      projectionUniform,
      false,
      mat4.perspective(
        mat4.create(),
        this.getFov(),
        this.viewportDimensions[0] / this.viewportDimensions[1],
        0.1,
        64,
      ),
    )

    const world2ViewUniform = this.currentShader.uniforms.get('world2View')
    if (world2ViewUniform === undefined) {
      throw new Error(`shader ${name} world2View uniform undefined`)
    }

    this.ctx.uniformMatrix4fv(
      world2ViewUniform,
      false,
      this.world2ViewTransform,
    )
  }

  clear(): void {
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
  }

  setWvTransform(w2v: mat4): void {
    mat4.copy(this.world2ViewTransform, w2v)
  }

  renderStandard(
    renderBody: (
      drawFunc: (
        modelName: string,
        posXY: Immutable<vec2>,
        rotXY: number,
      ) => void,
    ) => void,
  ): void {
    this.useShader('standard')
    this.ctx.enable(this.ctx.DEPTH_TEST)
    this.ctx.enable(this.ctx.CULL_FACE)
    this.ctx.cullFace(this.ctx.BACK)
    this.ctx.frontFace(this.ctx.CCW)

    renderBody(
      (modelName: string, posXY: Immutable<vec2>, rotXY: number): void => {
        this.drawModel(modelName, posXY, rotXY)
      },
    )
  }

  // TODO: implement renderDebug, which should use a different shader and
  // depth test

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

  loadModel(modelName: string, model: ModelDef, shaderName: string): void {
    const shader = this.shaders.get(shaderName)
    if (shader === undefined) {
      throw new Error(`shader undefined: ${shaderName}`)
    }

    const numVerts = model.positions.length / 3

    const positionAttrib = shader.attribs.get('position')
    if (positionAttrib === undefined) {
      throw new Error(`shader ${shaderName} has no position attrib`)
    }

    const colorAttrib = shader.attribs.get('color')
    if (colorAttrib === undefined) {
      throw new Error(`shader ${shaderName} has no color attrib`)
    }

    // Create terrain-specific VAO
    const vao = this.ctx.createVertexArray()!
    this.ctx.bindVertexArray(vao)

    // Vertices
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(positionAttrib)
    this.ctx.vertexAttribPointer(positionAttrib, 3, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      model.positions,
      this.ctx.STATIC_DRAW,
    )

    // Colors
    // TODO: some shaders might not accept vertex colors
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(colorAttrib)
    this.ctx.vertexAttribPointer(colorAttrib, 4, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      new Float32Array(model.colors),
      this.ctx.STATIC_DRAW,
    )

    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)

    // Set VAO
    this.models.set(modelName, {
      vao,
      numVerts,
      primitive: model.primitive,
      shader: shaderName,
    })
  }

  /**
   * Draw the specified model with the given 2D position and rotation. The
   * position will be projected onto the XZ plane.
   */
  private drawModel(
    modelName: string,
    posXY: Immutable<vec2>,
    rotXY: number,
  ): void {
    const model = this.models.get(modelName)
    if (model === undefined) {
      throw new Error(`model ${modelName} not defined`)
    }

    if (this.currentShader === undefined) {
      throw new Error(
        `cannot render ${modelName} with no shader; did you remember to call setRenderPass()?`,
      )
    }

    this.ctx.bindVertexArray(model.vao)

    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }

    this.ctx.uniformMatrix4fv(
      model2WorldUniform,
      false,
      mat4.fromRotationTranslation(
        mat4.create(),
        // We have to negate rotXY here. Positive rotations on the XY plane
        // represent right-handed rotations around cross(+X, +Y), whereas
        // positive rotations on the XZ plane represent right-handed rotations
        // around cross(+X, -Z).
        quat.rotateY(quat.create(), quat.create(), -rotXY),
        vec3.fromValues(posXY[0], 0, posXY[1]),
      ),
    )

    let primitive
    switch (model.primitive) {
      case 'TRIANGLES':
        primitive = this.ctx.TRIANGLES
        break
      case 'LINES':
        primitive = this.ctx.LINES
        break
      default:
        throw new Error(`invalid primitive: ${model.primitive}`)
    }

    this.ctx.drawArrays(primitive, 0, model.numVerts)
  }

  /**
   * Draws a sequence of lines, all of the same color. `srcVerts` should be a
   * set of point pairs, with each point described by three contiguous floats.
   */
  //   drawLines(srcVerts: Float32Array, color: vec4): void {
  //     if (this.currentShader === undefined) {
  //       throw new Error(
  //         `cannot render lines with no shader; did you remember to call setRenderPass()?`,
  //       )
  //     }

  //     const positionAttrib = this.currentShader.attribs.get('position')
  //     if (positionAttrib === undefined) {
  //       throw new Error(`shader has no position attrib`)
  //     }

  //     const colorAttrib = this.currentShader.attribs.get('color')
  //     if (colorAttrib === undefined) {
  //       throw new Error(`shader has no color attrib`)
  //     }

  //     const model2WorldUniform = this.currentShader.uniforms.get('model2World')
  //     if (model2WorldUniform === undefined) {
  //       throw new Error(`shader has no model2World uniform`)
  //     }

  //     const numPoints = srcVerts.length / 3

  //     // Make a color buffer in memory
  //     const srcColors = new Float32Array(4 * numPoints)
  //     for (let i = 0; i < numPoints; i++) {
  //       for (let j = 0; j < 4; j++) {
  //         srcColors[i * 4 + j] = color[j]
  //       }
  //     }

  //     // Start a new VAO
  //     const vao = this.ctx.createVertexArray()
  //     if (vao === null) {
  //       throw new Error('could not create vertex array')
  //     }
  //     this.ctx.bindVertexArray(vao)

  //     // Setup position array
  //     const posGlBuffer = this.ctx.createBuffer()
  //     if (posGlBuffer === null) {
  //       throw new Error('could not create buffer')
  //     }
  //     this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, posGlBuffer)
  //     this.ctx.enableVertexAttribArray(positionAttrib)
  //     this.ctx.vertexAttribPointer(positionAttrib, 3, this.ctx.FLOAT, false, 0, 0)
  //     this.ctx.bufferData(this.ctx.ARRAY_BUFFER, srcVerts, this.ctx.STATIC_DRAW)

  //     // Setup vertex color buffer
  //     // TODO: we should use a different shader program that just lets us set
  //     // color as a frag shader uniform.
  //     const colorGlBuffer = this.ctx.createBuffer()
  //     if (colorGlBuffer === null) {
  //       throw new Error('could not create buffer')
  //     }
  //     this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, colorGlBuffer)
  //     this.ctx.enableVertexAttribArray(colorAttrib)
  //     this.ctx.vertexAttribPointer(colorAttrib, 4, this.ctx.FLOAT, false, 0, 0)
  //     this.ctx.bufferData(this.ctx.ARRAY_BUFFER, srcColors, this.ctx.STATIC_DRAW)

  //     // Our VAO is ready...set uniforms and execute the draw.
  //     this.ctx.uniformMatrix4fv(model2WorldUniform, false, mat4.create())
  //     this.ctx.drawArrays(this.ctx.LINES, 0, numPoints)

  //     // Unbind our objects and delete them
  //     this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
  //     this.ctx.bindVertexArray(null)
  //     this.ctx.deleteVertexArray(vao)
  //     this.ctx.deleteBuffer(posGlBuffer)
  //     this.ctx.deleteBuffer(colorGlBuffer)
  //   }
}
