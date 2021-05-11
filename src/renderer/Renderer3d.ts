import { vec4 } from 'gl-matrix'
import { mat4, vec2 } from 'gl-matrix'

import {
  makeLineCubeModel,
  makeLineGridModel,
  makeLineTileModel,
} from './geometryUtils'
import {
  RenderMesh,
  RenderMeshInstanced,
  RenderNode,
  makeRenderMeshInstanced,
  makeRenderNode,
} from './glUtils'
import { ShaderAttrib, ShaderUniform, attribName } from './shaders/common'

import {
  DataMeshInstanced,
  Float32ArrayWithSpan,
  MeshPrimitive,
  ModelModifiers,
  ModelNode,
} from '~/renderer/interfaces'
import { IModelLoader } from '~/renderer/ModelLoader'
import { shader as particleShader } from '~/renderer/shaders/particle'
import { shader as solidShader } from '~/renderer/shaders/solid'
import { shader as unlitShader } from '~/renderer/shaders/unlit'
import { shader as vcolor } from '~/renderer/shaders/vcolor'
import { shader as wiresolidShader } from '~/renderer/shaders/wiresolid'
import { Immutable } from '~/types/immutable'

enum DepthTestMode {
  Off,
  LessThan,
  LessThanOrEqual,
}

interface ShaderDefinition {
  vertexSrc: string
  fragmentSrc: string
}

interface Shader {
  program: WebGLProgram
  uniforms: Map<ShaderUniform, WebGLUniformLocation>
}

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
  backfaceCullingEnabled: boolean
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
  private gl: WebGL2RenderingContext

  private shaders: Map<string, Shader>
  private models: Map<string, RenderNode>
  private particleMeshes: Map<string, RenderMeshInstanced>

  private fov: number
  private viewportDimensions: vec2
  private world2ViewTransform: mat4
  private currentShader: Shader | undefined

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl

    this.shaders = new Map()
    this.loadShader('vcolor', vcolor)
    this.loadShader('particle', particleShader)
    this.loadShader('solid', solidShader)
    this.loadShader('unlit', unlitShader)
    this.loadShader('wiresolid', wiresolidShader)

    this.models = new Map()
    this.loadModel('linecube', makeLineCubeModel())
    this.loadModel('linetile', makeLineTileModel())
    this.loadModel('linegrid', makeLineGridModel())

    this.particleMeshes = new Map()

    this.fov = Math.PI / 2 // set some sane default

    this.viewportDimensions = vec2.create()
    this.syncViewportDimensions()

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

    const program = this.gl.createProgram()
    if (program === null) {
      throw `unable to create shader program`
    }

    // Bind attribute names to conventional locations.
    // This needs to occur _before_ linking, which freezes the program.
    for (const attrib of Object.values(ShaderAttrib)) {
      if (typeof attrib !== 'number') {
        continue
      }
      this.gl.bindAttribLocation(program, attrib, attribName(attrib))
    }

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

    // Build mapping between uniform name and location
    const uniforms = new Map()
    for (const u of Object.values(ShaderUniform)) {
      const loc = this.gl.getUniformLocation(program, u)
      if (loc !== null) {
        uniforms.set(u, loc)
      }
    }

    this.shaders.set(name, {
      program,
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

    const projectionUniform = this.currentShader.uniforms.get(
      ShaderUniform.Projection,
    )
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

    const world2ViewUniform = this.currentShader.uniforms.get(
      ShaderUniform.World2View,
    )
    if (world2ViewUniform === undefined) {
      throw new Error(`shader ${name} world2View uniform undefined`)
    }

    this.gl.uniformMatrix4fv(world2ViewUniform, false, this.world2ViewTransform)
  }

  private applySettings(settings: RenderSettings): void {
    // Currently, all render modes use backface culling.
    if (settings.backfaceCullingEnabled) {
      this.gl.enable(this.gl.CULL_FACE)
      this.gl.cullFace(this.gl.BACK)
      this.gl.frontFace(this.gl.CCW)
    } else {
      this.gl.disable(this.gl.CULL_FACE)
    }

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

  clear(r = 0.0, g = 0.0, b = 0.0, a = 1.0): void {
    this.gl.clearColor(r, g, b, a)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
  }

  getViewportDimension(): Immutable<vec2> {
    return this.viewportDimensions
  }

  getFov(): number {
    return this.fov
  }

  setFov(fov: number): void {
    this.fov = fov
  }

  syncViewportDimensions(): void {
    this.viewportDimensions[0] = this.gl.canvas.width
    this.viewportDimensions[1] = this.gl.canvas.height

    // Update gl viewport
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
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
      backfaceCullingEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World } of objects) {
      const root = this.models.get(modelName)
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
      backfaceCullingEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.models.get(modelName)
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
      backfaceCullingEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.models.get(modelName)
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
      backfaceCullingEnabled: true,
      colorEnabled: false,
      depthTestMode: DepthTestMode.LessThan,
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const root = this.models.get(modelName)
      if (root === undefined) {
        throw new Error(`unknown model ${modelName}`)
      }
      this.renderNode(root, '', modelModifiers, model2World, color)
    }

    // Second pass: draw lines to color buffer
    this.applySettings({
      alphaEnabled: true,
      backfaceCullingEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThanOrEqual, // allow drawing over existing opaque faces
    })

    for (const { modelName, modelModifiers, model2World, color } of objects) {
      const lineModel = modelName + '-line'
      const root = this.models.get(lineModel)
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

    for (const mesh of node.meshes) {
      this.renderMesh(mesh, model2World, color)
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

    const model2WorldUniform = this.currentShader.uniforms.get(
      ShaderUniform.Model2World,
    )
    if (model2WorldUniform === undefined) {
      throw new Error(`shader has no model2World uniform`)
    }

    // Optional uniforms
    const colorUniform = this.currentShader.uniforms.get(ShaderUniform.Color)

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

    this.gl.bindVertexArray(mesh.vao)
    this.gl.drawElements(
      this.meshPrimitiveToDrawMode(mesh.primitive),
      mesh.count,
      mesh.type,
      0,
    )
    this.gl.bindVertexArray(null)
  }

  private meshPrimitiveToDrawMode(p: MeshPrimitive): GLenum {
    switch (p) {
      case MeshPrimitive.Triangles:
        return this.gl.TRIANGLES
      case MeshPrimitive.Lines:
        return this.gl.LINES
    }
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
      backfaceCullingEnabled: true,
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThanOrEqual, // allow drawing over existing surfaces
    })

    for (const obj of objects) {
      switch (obj.type) {
        case UnlitObjectType.Lines:
          this.gl.uniform4fv(
            this.currentShader!.uniforms.get(ShaderUniform.Color)!,
            obj.color,
          )
          this.drawLines(obj.positions)
          break

        case UnlitObjectType.Model:
          const model = this.models.get(obj.modelName)
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

  /**
   * Render a particle mesh, optionally updating instance attrib data before
   * drawing.
   */
  public renderParticles(
    name: string,
    instances: number,
    // Map of attrib location to update data. Update data includes an array,
    // an offset into the array, and a length. The array is assumed to be the
    // same size as the buffer being updated, but only the range specified by
    // the offset and the length will be updated.
    attribData?: Map<number, Float32ArrayWithSpan>,
  ): void {
    const mesh = this.particleMeshes.get(name)
    if (mesh === undefined) {
      throw `particle mesh ${name} not found`
    }

    this.gl.bindVertexArray(mesh.vao)

    if (attribData !== undefined) {
      for (const [attrib, [data, srcOffset, srcLength]] of attribData) {
        // We assume here that the attrib data contains enough to satisfy the
        // instance count. Since we don't have componentsPerAttrib here, we can't
        // verify.

        const glBuffer = mesh.instanceAttribBuffers.get(attrib)
        if (glBuffer === undefined) {
          throw `particle mesh ${name} does not use attrib ${attrib}`
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, glBuffer)
        this.gl.bufferSubData(
          this.gl.ARRAY_BUFFER,
          srcOffset * 4, // this is a byte offset
          data,
          srcOffset, // this is a float offset
          srcLength,
        )
      }
    }

    this.useShader('particle')
    this.applySettings({
      alphaEnabled: true,
      backfaceCullingEnabled: false, // render both sides of a particle
      colorEnabled: true,
      depthTestMode: DepthTestMode.LessThan,
    })
    this.gl.drawArraysInstanced(
      this.meshPrimitiveToDrawMode(mesh.primitive),
      0,
      mesh.vertsPerInstance,
      instances,
    )

    this.gl.bindVertexArray(null)
  }

  loadModel(name: string, root: ModelNode): void {
    if (this.models.has(name)) {
      throw new Error(`model with name ${name} already exists`)
    }
    this.models.set(name, makeRenderNode(this.gl, root))
  }

  loadParticleMesh(
    name: string,
    dataMesh: DataMeshInstanced,
    maxInstances: number,
  ): void {
    if (this.particleMeshes.has(name)) {
      throw `particle mesh with name ${name} already exists`
    }
    this.particleMeshes.set(
      name,
      makeRenderMeshInstanced(this.gl, dataMesh, maxInstances),
    )
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
    const posGlBuffer = this.gl.createBuffer()
    if (posGlBuffer === null) {
      throw new Error('could not create buffer')
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posGlBuffer)
    this.gl.enableVertexAttribArray(ShaderAttrib.Position)
    this.gl.vertexAttribPointer(
      ShaderAttrib.Position,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    )
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)

    // Our VAO is ready...set uniforms and execute the draw.
    const model2WorldUniform = this.currentShader.uniforms.get(
      ShaderUniform.Model2World,
    )
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
