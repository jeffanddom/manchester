import { vec4 } from 'gl-matrix'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Model as ModelDef, ModelPrimitive } from '~/models'
import { shader as standardShader } from '~/renderer/shaders/standard'
import { shader as wireShader } from '~/renderer/shaders/wire'
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
  primitive: ModelPrimitive
  shader: string
}

interface WireLines {
  type: 'LINES'
  positions: Float32Array
  color: vec4
}

interface WireCube {
  type: 'CUBE'
  pos: vec3
  color: vec4
  scale?: number
  rot?: quat
}

interface WireModel {
  type: 'MODEL'
  id: string
  color: vec4
}

export type WireObject = WireLines | WireCube | WireModel

const wcHalfSize = 0.5
const wcLowNW = [-wcHalfSize, -wcHalfSize, -wcHalfSize]
const wcLowNE = [wcHalfSize, -wcHalfSize, -wcHalfSize]
const wcLowSW = [-wcHalfSize, -wcHalfSize, wcHalfSize]
const wcLowSE = [wcHalfSize, -wcHalfSize, wcHalfSize]
const wcHighNW = [-wcHalfSize, wcHalfSize, -wcHalfSize]
const wcHighNE = [wcHalfSize, wcHalfSize, -wcHalfSize]
const wcHighSW = [-wcHalfSize, wcHalfSize, wcHalfSize]
const wcHighSE = [wcHalfSize, wcHalfSize, wcHalfSize]

export const wireCubeModel = {
  // "as const" convinces the typechecker that this property will not be
  // re-assigned.
  primitive: ModelPrimitive.Lines,

  // prettier-ignore
  positions: new Float32Array([
    ...wcLowNW, ...wcLowNE,
    ...wcLowNE, ...wcLowSE,
    ...wcLowSE, ...wcLowSW,
    ...wcLowSW, ...wcLowNW,

    ...wcHighNW, ...wcHighNE,
    ...wcHighNE, ...wcHighSE,
    ...wcHighSE, ...wcHighSW,
    ...wcHighSW, ...wcHighNW,          

    ...wcLowNE, ...wcHighNE,
    ...wcLowNW, ...wcHighNW,
    ...wcLowSE, ...wcHighSE,
    ...wcLowSW, ...wcHighSW,
  ]),
}

const wireTilePositions = []
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    -32 * TILE_SIZE,
    0,
    i * TILE_SIZE,
    32 * TILE_SIZE,
    0,
    i * TILE_SIZE,
  )
}
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    i * TILE_SIZE,
    0,
    -32 * TILE_SIZE,
    i * TILE_SIZE,
    0,
    32 * TILE_SIZE,
  )
}

const wireTilesModel = {
  positions: new Float32Array(wireTilePositions),
  primitive: ModelPrimitive.Lines,
}

export interface IModelLoader {
  loadModel: (modelName: string, model: ModelDef, shaderName: string) => void
}

export class StubModelLoader implements IModelLoader {
  loadModel(_modelName: string, _model: ModelDef, _shaderName: string): void {
    /* do nothing */
  }
}

export class Renderer3d implements IModelLoader {
  private canvas: HTMLCanvasElement
  private ctx: WebGL2RenderingContext

  private shaders: Map<string, Shader>
  private models: Map<string, Model>

  private fov: number
  private viewportDimensions: vec2
  private world2ViewTransform: mat4
  private currentShader: Shader | undefined

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.ctx = canvas.getContext('webgl2')!

    this.shaders = new Map()
    this.loadShader('standard', standardShader)
    this.loadShader('wire', wireShader)

    this.models = new Map()
    this.loadModel('wireCube', wireCubeModel, 'wire')
    this.loadModel('wireTiles', wireTilesModel, 'wire')

    this.fov = (75 * Math.PI) / 180 // set some sane default
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
      if (loc === null) {
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
    return this.fov
  }

  // TODO: connect this with Camera3d#fov
  setFov(fov: number): void {
    this.fov = fov
  }

  setViewportDimensions(d: Immutable<vec2>): void {
    vec2.copy(this.viewportDimensions, d)

    // Update gl viewport
    this.ctx.viewport(0, 0, d[0], d[1])
  }

  setWvTransform(w2v: mat4): void {
    mat4.copy(this.world2ViewTransform, w2v)
  }

  /**
   * Render using standard shader. Currently uses vertex colors, with no
   * lighting or textures.
   */
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
    this.ctx.depthFunc(this.ctx.LESS)
    this.ctx.enable(this.ctx.CULL_FACE)
    this.ctx.cullFace(this.ctx.BACK)
    this.ctx.frontFace(this.ctx.CCW)

    renderBody(
      (modelName: string, posXY: Immutable<vec2>, rotXY: number): void => {
        this.drawModel(
          modelName,
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
      },
    )
  }

  /**
   * Render using the wire shader. Intended for debug draw.
   */
  renderWire(renderBody: (drawFunc: (obj: WireObject) => void) => void): void {
    this.useShader('wire')
    this.ctx.enable(this.ctx.DEPTH_TEST)
    this.ctx.depthFunc(this.ctx.LEQUAL) // allow drawing over existing surfaces
    this.ctx.enable(this.ctx.CULL_FACE)
    this.ctx.cullFace(this.ctx.BACK)
    this.ctx.frontFace(this.ctx.CCW)

    renderBody((obj: WireObject): void => {
      this.ctx.uniform4fv(this.currentShader!.uniforms.get('color')!, obj.color)

      switch (obj.type) {
        case 'CUBE':
          const rot = obj.rot ?? quat.create()
          const scale = obj.scale ?? 1

          this.drawModel(
            'wireCube',
            mat4.fromRotationTranslationScale(
              mat4.create(),
              rot,
              obj.pos,
              vec3.fromValues(scale, scale, scale),
            ),
          )
          break

        case 'LINES':
          this.drawLines(obj.positions)
          break

        case 'MODEL':
          this.drawModel(obj.id, mat4.create())
          break
      }
    })
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

    // Create terrain-specific VAO
    const vao = this.ctx.createVertexArray()!
    this.ctx.bindVertexArray(vao)

    // Positions
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
    this.ctx.enableVertexAttribArray(positionAttrib)
    this.ctx.vertexAttribPointer(positionAttrib, 3, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(
      this.ctx.ARRAY_BUFFER,
      model.positions,
      this.ctx.STATIC_DRAW,
    )

    // Colors
    if (model.colors !== undefined) {
      const colorAttrib = shader.attribs.get('color')
      if (colorAttrib === undefined) {
        throw new Error(`shader ${shaderName} has no color attrib`)
      }

      this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.ctx.createBuffer())
      this.ctx.enableVertexAttribArray(colorAttrib)
      this.ctx.vertexAttribPointer(colorAttrib, 4, this.ctx.FLOAT, false, 0, 0)
      this.ctx.bufferData(
        this.ctx.ARRAY_BUFFER,
        new Float32Array(model.colors),
        this.ctx.STATIC_DRAW,
      )
    }

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
  private drawModel(modelName: string, model2World: mat4): void {
    if (this.currentShader === undefined) {
      throw new Error(
        `cannot render ${modelName} with no shader; did you remember to call setRenderPass()?`,
      )
    }

    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }
    this.ctx.uniformMatrix4fv(model2WorldUniform, false, model2World)

    const model = this.models.get(modelName)
    if (model === undefined) {
      throw new Error(`model ${modelName} not defined`)
    }
    this.ctx.bindVertexArray(model.vao)

    switch (model.primitive) {
      case ModelPrimitive.Lines:
        this.ctx.drawArrays(this.ctx.LINES, 0, model.numVerts)
        break
      case ModelPrimitive.Triangles:
        this.ctx.drawArrays(this.ctx.TRIANGLES, 0, model.numVerts)
        break
    }
  }

  /**
   * Draws a sequence of lines, all of the same color. `srcVerts` should be a
   * set of point pairs, with each point described by three contiguous floats.
   */
  drawLines(positions: Float32Array): void {
    if (this.currentShader === undefined) {
      throw new Error(
        `cannot render lines with no shader; did you remember to call setRenderPass()?`,
      )
    }

    const numPoints = positions.length / 3

    // Start a new VAO
    const vao = this.ctx.createVertexArray()
    if (vao === null) {
      throw new Error('could not create vertex array')
    }
    this.ctx.bindVertexArray(vao)

    // Setup position array
    const positionAttrib = this.currentShader.attribs.get('position')
    if (positionAttrib === undefined) {
      throw new Error(`shader has no position attrib`)
    }
    const posGlBuffer = this.ctx.createBuffer()
    if (posGlBuffer === null) {
      throw new Error('could not create buffer')
    }
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, posGlBuffer)
    this.ctx.enableVertexAttribArray(positionAttrib)
    this.ctx.vertexAttribPointer(positionAttrib, 3, this.ctx.FLOAT, false, 0, 0)
    this.ctx.bufferData(this.ctx.ARRAY_BUFFER, positions, this.ctx.STATIC_DRAW)

    // Our VAO is ready...set uniforms and execute the draw.
    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }
    this.ctx.uniformMatrix4fv(model2WorldUniform, false, mat4.create())
    this.ctx.drawArrays(this.ctx.LINES, 0, numPoints)

    // Unbind our objects and delete them
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null)
    this.ctx.bindVertexArray(null)
    this.ctx.deleteVertexArray(vao)
    this.ctx.deleteBuffer(posGlBuffer)
  }
}
