import { vec4 } from 'gl-matrix'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'

import { makeLineCubeModel } from './geometryUtils'
import { RenderMesh, RenderNode, makeRenderNode } from './glUtils'
import { ModelDef } from './interfacesOld'

import {
  MeshPrimitive,
  ModelModifiers,
  ModelNode,
  ModelPrimitive,
} from '~/renderer/interfaces'
import { IModelLoader } from '~/renderer/ModelLoader'
import { shader as solidShader } from '~/renderer/shaders/solid'
import { shader as unlitShader } from '~/renderer/shaders/unlit'
import { shader as vcolor } from '~/renderer/shaders/vcolor'
import { shader as wiresolidShader } from '~/renderer/shaders/wiresolid'
import * as wireModels from '~/renderer/wireModels'
import { Immutable } from '~/types/immutable'

enum DepthTestMode {
  Off,
  LessThan,
  LessThanOrEqual,
}

interface ShaderDefinition {
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

interface WireModel {
  type: 'MODEL'
  modelName: string
  color: vec4
  translate?: vec3
  uniformScale?: number
  scale?: vec3
  rot?: quat
}

export type WireObject = WireLines | WireModel

export enum UnlitObjectType {
  Lines,
  Model,
}

interface UnlitLines {
  type: UnlitObjectType.Lines
  positions: Float32Array
  color: vec4
}

interface UnlitModel {
  type: UnlitObjectType.Model
  modelName: string
  model2World: mat4
  color: vec4
  modelModifiers?: ModelModifiers
}

export type UnlitObject = UnlitLines | UnlitModel

interface RenderSettings {
  alphaEnabled: boolean
  colorEnabled: boolean
  depthTestMode: DepthTestMode
}

export class VertexShaderError extends Error {
  constructor(log: string) {
    super('vertex shader compile error: ' + log)
  }
}

export class FragmentShaderError extends Error {
  constructor(log: string) {
    super('fragment shader compile error: ' + log)
  }
}

export class ShaderCompileError extends Error {
  constructor(opts: { vertexShaderLog?: string; fragmentShaderLog?: string }) {
    const log = (opts.vertexShaderLog ?? '') + (opts.fragmentShaderLog ?? '')
    super(`shader compile error: ${log}`)
  }
}

export class ShaderLinkError extends Error {}

export class Renderer3d implements IModelLoader {
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext

  private shaders: Map<string, Shader>
  private models: Map<string, Model> // DEPRECATED
  private renderRootNodes: Map<string, RenderNode>

  private fov: number
  private viewportDimensions: vec2
  private world2ViewTransform: mat4
  private currentShader: Shader | undefined

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.gl = canvas.getContext('webgl2')!

    this.shaders = new Map()
    this.loadShader('vcolor', vcolor)
    this.loadShader('solid', solidShader)
    this.loadShader('unlit', unlitShader)
    this.loadShader('wiresolid', wiresolidShader)

    this.models = new Map() // DEPRECATED
    this.loadModelDef('wireTile', wireModels.tile, 'unlit')
    this.loadModelDef('wireTileGrid', wireModels.tileGrid, 'unlit')

    this.renderRootNodes = new Map()
    this.loadModel('linecube', makeLineCubeModel())

    this.fov = (75 * Math.PI) / 180 // set some sane default
    this.viewportDimensions = vec2.fromValues(
      this.canvas.width,
      this.canvas.height,
    )
    this.setViewportDimensions(this.viewportDimensions)

    this.world2ViewTransform = mat4.create()
    this.currentShader = undefined
  }

  public loadShader(
    name: string,
    def: ShaderDefinition,
    options: { allowOverride?: boolean } = {},
  ): void {
    if (this.shaders.has(name) && !(options.allowOverride ?? false)) {
      throw new Error(`shader ${name} already defined`)
    }

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!
    this.gl.shaderSource(vertexShader, def.vertexSrc)
    this.gl.compileShader(vertexShader)
    if (
      this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS) === false
    ) {
      throw new VertexShaderError(this.gl.getShaderInfoLog(vertexShader)!)
    }

    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!
    this.gl.shaderSource(fragmentShader, def.fragmentSrc)
    this.gl.compileShader(fragmentShader)
    if (
      this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS) ===
      false
    ) {
      throw new FragmentShaderError(this.gl.getShaderInfoLog(fragmentShader)!)
    }

    const program = this.gl.createProgram()!
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS) === false) {
      throw new ShaderLinkError(this.gl.getProgramInfoLog(program)!)
    }

    const linkStatus = this.gl.getProgramParameter(program, this.gl.LINK_STATUS)
    if (linkStatus === 0) {
      const info = this.gl.getProgramInfoLog(program)
      throw 'Could not compile WebGL program. \n\n' + info
    }

    const attribs = new Map()
    for (const a of def.attribs) {
      if (attribs.has(a)) {
        throw new Error(`shader ${name} attrib ${a} already defined`)
      }

      const loc = this.gl.getAttribLocation(program, a)
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

      const loc = this.gl.getUniformLocation(program, u)
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
    this.gl.useProgram(this.currentShader.program)

    // Setup some common uniforms

    const projectionUniform = this.currentShader.uniforms.get('projection')
    if (projectionUniform === undefined) {
      throw new Error(`shader ${name} projection uniform undefined`)
    }

    this.gl.uniformMatrix4fv(
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

    this.gl.uniformMatrix4fv(world2ViewUniform, false, this.world2ViewTransform)
  }

  private applySettings(settings: RenderSettings): void {
    // Currently, all render modes use backface culling.
    this.gl.enable(this.gl.CULL_FACE)
    this.gl.cullFace(this.gl.BACK)
    this.gl.frontFace(this.gl.CCW)

    if (settings.colorEnabled) {
      this.gl.colorMask(true, true, true, true)
    } else {
      this.gl.colorMask(false, false, false, false)
    }

    switch (settings.depthTestMode) {
      case DepthTestMode.Off:
        this.gl.disable(this.gl.DEPTH_TEST)
        break

      case DepthTestMode.LessThan:
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.gl.LESS)
        break

      case DepthTestMode.LessThanOrEqual:
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthFunc(this.gl.LEQUAL)
        break
    }

    if (settings.alphaEnabled) {
      this.gl.enable(this.gl.BLEND)
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    } else {
      this.gl.disable(this.gl.BLEND)
    }
  }

  clear(): void {
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
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
    this.gl.viewport(0, 0, d[0], d[1])
  }

  setWvTransform(w2v: mat4): void {
    mat4.copy(this.world2ViewTransform, w2v)
  }

  /**
   * Render with vertex coloring.
   */
  renderVColor(
    objects: {
      modelName: string
      modelModifiers: ModelModifiers
      model2World: Immutable<mat4>
    }[],
  ): void {
    this.useShader('vcolor')
    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World } of objects) {
      const root = this.renderRootNodes.get(modelName)
      if (root === undefined) {
        throw new Error(`unknown model ${modelName}`)
      }
      this.renderNode(root, '', modelModifiers, model2World)
    }
  }

  /**
   * Render using the solid shader, specifying models with per-mesh transforms.
   */
  renderSolid(
    objects: {
      modelName: string
      modelModifiers: ModelModifiers
      model2World: Immutable<mat4>
      color: Immutable<vec4>
    }[],
  ): void {
    this.useShader('solid')
    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.renderRootNodes.get(modelName)
      if (root === undefined) {
        throw new Error(`unknown model ${modelName}`)
      }
      this.renderNode(root, '', modelModifiers, model2World, color)
    }
  }

  /**
   * Render using the wiresolid shader, specifying models with per-mesh transforms.
   */
  renderWiresolid(
    objects: {
      modelName: string
      modelModifiers: ModelModifiers
      model2World: Immutable<mat4>
      color: Immutable<vec4>
    }[],
  ): void {
    this.useShader('wiresolid')
    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.renderRootNodes.get(modelName)
      if (root === undefined) {
        throw new Error(`unknown model ${modelName}`)
      }
      this.renderNode(root, '', modelModifiers, model2World, color)
    }
  }

  /**
   * Render a wiresolid effect with a line mesh for the wireframe. A corresponding
   * line mesh model must be loaded.
   */
  renderWiresolidLine(
    objects: {
      modelName: string
      modelModifiers: ModelModifiers
      model2World: Immutable<mat4>
      color: Immutable<vec4>
    }[],
  ): void {
    this.useShader('unlit')

    // First pass: write to the depth buffer only
    this.applySettings({
      alphaEnabled: false,
      colorEnabled: false,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.renderRootNodes.get(modelName)
      if (root === undefined) {
        throw new Error(`unknown model ${modelName}`)
      }
      this.renderNode(root, '', modelModifiers, model2World, color)
    }

    // Second pass: draw lines to color buffer
    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThanOrEqual, // allow drawing over existing opaque faces
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const lineModel = modelName + '-line'
      const root = this.renderRootNodes.get(lineModel)
      if (root === undefined) {
        throw new Error(`unknown model ${lineModel}`)
      }
      this.renderNode(root, '', modelModifiers, model2World, color)
    }
  }

  private renderNode(
    node: RenderNode,
    parentPath: string,
    modelModifiers: ModelModifiers,
    model2World: Immutable<mat4>,
    color?: Immutable<vec4>,
  ): void {
    const path = parentPath === '' ? node.name : `${parentPath}.${node.name}`

    const prePath = `${path}:pre`
    if (modelModifiers.hasOwnProperty(prePath)) {
      model2World = mat4.multiply(
        mat4.create(),
        model2World,
        modelModifiers[prePath],
      )
    }

    if (node.transform !== undefined) {
      model2World = mat4.multiply(mat4.create(), model2World, node.transform)
    }

    const postPath = `${path}:post`
    if (modelModifiers.hasOwnProperty(postPath)) {
      model2World = mat4.multiply(
        mat4.create(),
        model2World,
        modelModifiers[postPath],
      )
    }

    if (node.mesh !== undefined) {
      this.renderMesh(node.mesh, model2World, color)
    }

    for (const c of node.children) {
      this.renderNode(c, path, modelModifiers, model2World, color)
    }
  }

  private renderMesh(
    mesh: RenderMesh,
    model2World: Immutable<mat4>,
    color?: Immutable<vec4>,
  ): void {
    if (this.currentShader === undefined) {
      throw new Error(`cannot render without current shader`)
    }

    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }

    const positionAttrib = this.currentShader.attribs.get('position')
    if (positionAttrib === undefined) {
      throw new Error(`shader has no position attrib`)
    }

    // Optional uniforms
    const colorUniform = this.currentShader.uniforms.get('color')

    // Optional attribs
    const colorAttrib = this.currentShader.attribs.get('color')
    const edgeOnAttrib = this.currentShader.attribs.get('edgeOn')
    const normalAttrib = this.currentShader.attribs.get('normal')

    // Uniforms
    this.gl.uniformMatrix4fv(
      model2WorldUniform,
      false,
      model2World as Float32Array,
    )

    if (colorUniform !== undefined) {
      if (color === undefined) {
        throw `value for color uniform not provided`
      }
      this.gl.uniform4fv(colorUniform, color as Float32Array)
    }

    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    // Position attrib
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.positions.buffer)
    this.gl.enableVertexAttribArray(positionAttrib)
    this.gl.vertexAttribPointer(
      positionAttrib,
      mesh.positions.componentsPerAttrib,
      mesh.positions.glType,
      false,
      0,
      0,
    )

    // color attrib
    if (colorAttrib !== undefined && mesh.colors !== undefined) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.colors.buffer)
      this.gl.enableVertexAttribArray(colorAttrib)
      this.gl.vertexAttribPointer(
        colorAttrib,
        mesh.colors.componentsPerAttrib,
        mesh.colors.glType,
        false,
        0,
        0,
      )
    }

    // edgeOn attrib
    if (
      edgeOnAttrib !== undefined &&
      mesh.primitive == MeshPrimitive.Triangles &&
      mesh.edgeOn !== undefined
    ) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.edgeOn.buffer)
      this.gl.enableVertexAttribArray(edgeOnAttrib)
      this.gl.vertexAttribPointer(
        edgeOnAttrib,
        mesh.edgeOn.componentsPerAttrib,
        mesh.edgeOn.glType,
        false,
        0,
        0,
      )
    }

    // Normal attrib
    if (normalAttrib !== undefined) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, mesh.normals.buffer)
      this.gl.enableVertexAttribArray(normalAttrib)
      this.gl.vertexAttribPointer(
        normalAttrib,
        mesh.normals.componentsPerAttrib,
        mesh.normals.glType,
        false,
        0,
        0,
      )
    }

    // Index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices.buffer)

    switch (mesh.primitive) {
      case MeshPrimitive.Triangles:
        this.gl.drawElements(
          this.gl.TRIANGLES,
          mesh.indices.componentCount,
          mesh.indices.glType,
          0,
        )
        break
      case MeshPrimitive.Lines:
        this.gl.drawElements(
          this.gl.LINES,
          mesh.indices.componentCount,
          mesh.indices.glType,
          0,
        )
        break
    }

    // TODO: figure out how to preserve VAO. Probably, the GLTF loading
    // helpers should have access to shader attribute locations, but we need
    // a way to make those consistent across shaders.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null)
    this.gl.bindVertexArray(null)
    this.gl.deleteVertexArray(vao)
  }

  /**
   * Render using the unlit shader. Intended for debug draw.
   */
  /**
   * Render using the unlit shader. Intended for debug draw.
   */
  renderUnlit(objects: UnlitObject[]): void {
    this.useShader('unlit')

    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThanOrEqual, // allow drawing over existing surfaces
    })

    for (const obj of objects) {
      switch (obj.type) {
        case UnlitObjectType.Lines:
          this.gl.uniform4fv(
            this.currentShader!.uniforms.get('color')!,
            obj.color,
          )
          this.drawLines(obj.positions)
          break

        case UnlitObjectType.Model:
          const model = this.renderRootNodes.get(obj.modelName)
          if (model === undefined) {
            throw `model ${obj.modelName} not found`
          }
          this.renderNode(
            model,
            '',
            obj.modelModifiers ?? {},
            obj.model2World,
            obj.color,
          )
          break
      }
    }
  }

  renderUnlitOld(objects: WireObject[]): void {
    this.useShader('unlit')

    this.applySettings({
      alphaEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThanOrEqual, // allow drawing over existing surfaces
    })

    for (const obj of objects) {
      this.gl.uniform4fv(this.currentShader!.uniforms.get('color')!, obj.color)

      switch (obj.type) {
        case 'LINES':
          this.drawLines(obj.positions)
          break

        case 'MODEL':
          const scale = vec3.fromValues(1, 1, 1)
          if (obj.scale !== undefined) {
            vec3.copy(scale, obj.scale)
          } else if (obj.uniformScale !== undefined) {
            scale[0] = obj.uniformScale
            scale[1] = obj.uniformScale
            scale[2] = obj.uniformScale
          }

          this.drawModel(
            obj.modelName,
            mat4.fromRotationTranslationScale(
              mat4.create(),
              obj.rot ?? quat.create(),
              obj.translate ?? vec3.create(),
              scale,
            ),
          )
          break
      }
    }
  }

  /**
   * DEPRECATED
   */
  loadModelDef(modelName: string, model: ModelDef, shaderName: string): void {
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
    const vao = this.gl.createVertexArray()!
    this.gl.bindVertexArray(vao)

    // Positions
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
    this.gl.enableVertexAttribArray(positionAttrib)
    this.gl.vertexAttribPointer(positionAttrib, 3, this.gl.FLOAT, false, 0, 0)
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      model.positions,
      this.gl.STATIC_DRAW,
    )

    // Colors
    if (model.colors !== undefined) {
      const colorAttrib = shader.attribs.get('color')
      if (colorAttrib === undefined) {
        throw new Error(`shader ${shaderName} has no color attrib`)
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
      this.gl.enableVertexAttribArray(colorAttrib)
      this.gl.vertexAttribPointer(colorAttrib, 4, this.gl.FLOAT, false, 0, 0)
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(model.colors),
        this.gl.STATIC_DRAW,
      )
    }

    // Normals
    const normalAttrib = shader.attribs.get('normal')
    if (normalAttrib !== undefined && model.normals !== undefined) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer())
      this.gl.enableVertexAttribArray(normalAttrib)
      this.gl.vertexAttribPointer(normalAttrib, 3, this.gl.FLOAT, false, 0, 0)
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        model.normals,
        this.gl.STATIC_DRAW,
      )
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindVertexArray(null)

    // Set VAO
    this.models.set(modelName, {
      vao,
      numVerts,
      primitive: model.primitive,
      shader: shaderName,
    })
  }

  loadModel(name: string, root: ModelNode): void {
    if (this.renderRootNodes.has(name)) {
      throw new Error(`model with name ${name} already exists`)
    }
    this.renderRootNodes.set(name, makeRenderNode(root, this.gl))
  }

  /**
   * Draw the specified model with the given 2D position and rotation. The
   * position will be projected onto the XZ plane.
   */
  private drawModel(modelName: string, model2World: mat4): void {
    if (this.currentShader === undefined) {
      throw new Error(`cannot render without current shader`)
    }

    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }
    this.gl.uniformMatrix4fv(model2WorldUniform, false, model2World)

    const model = this.models.get(modelName)
    if (model === undefined) {
      throw new Error(`model ${modelName} not defined`)
    }
    this.gl.bindVertexArray(model.vao)

    switch (model.primitive) {
      case ModelPrimitive.Lines:
        this.gl.drawArrays(this.gl.LINES, 0, model.numVerts)
        break
      case ModelPrimitive.Triangles:
        this.gl.drawArrays(this.gl.TRIANGLES, 0, model.numVerts)
        break
    }
  }

  /**
   * Draws a sequence of lines, all of the same color. `srcVerts` should be a
   * set of point pairs, with each point described by three contiguous floats.
   */
  private drawLines(positions: Float32Array): void {
    if (this.currentShader === undefined) {
      throw new Error(`cannot render without current shader`)
    }

    const numPoints = positions.length / 3

    // Start a new VAO
    const vao = this.gl.createVertexArray()
    if (vao === null) {
      throw new Error('could not create vertex array')
    }
    this.gl.bindVertexArray(vao)

    // Setup position array
    const positionAttrib = this.currentShader.attribs.get('position')
    if (positionAttrib === undefined) {
      throw new Error(`shader has no position attrib`)
    }
    const posGlBuffer = this.gl.createBuffer()
    if (posGlBuffer === null) {
      throw new Error('could not create buffer')
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posGlBuffer)
    this.gl.enableVertexAttribArray(positionAttrib)
    this.gl.vertexAttribPointer(positionAttrib, 3, this.gl.FLOAT, false, 0, 0)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)

    // Our VAO is ready...set uniforms and execute the draw.
    const model2WorldUniform = this.currentShader.uniforms.get('model2World')
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }
    this.gl.uniformMatrix4fv(model2WorldUniform, false, mat4.create())
    this.gl.drawArrays(this.gl.LINES, 0, numPoints)

    // Unbind our objects and delete them
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
    this.gl.bindVertexArray(null)
    this.gl.deleteVertexArray(vao)
    this.gl.deleteBuffer(posGlBuffer)
  }
}
