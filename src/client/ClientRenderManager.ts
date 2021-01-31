import { mat2d, mat4, vec2, vec4 } from 'gl-matrix'

import { IDebugDrawReader, IDebugDrawWriter } from '~/DebugDraw'
import { ModelModifiers } from '~/renderer/interfaces'
import { IModelLoader } from '~/renderer/ModelLoader'
import { Renderer2d } from '~/renderer/Renderer2d'
import { Renderer3d } from '~/renderer/Renderer3d'
import { Immutable } from '~/types/immutable'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export interface Renderable3dOld {
  modelName: string
  posXY: Immutable<vec2>
  rotXY: number
}

export interface Renderable3dSolid {
  modelName: string
  modelModifiers: ModelModifiers
  model2World: mat4
  color: Immutable<vec4>
}

export class ClientRenderManager {
  renderer3d: Renderer3d
  renderer2d: Renderer2d
  debugDraw: IDebugDrawWriter & IDebugDrawReader

  // diagnostic metrics
  lastRenderAt: number
  renderDurations: RunningAverage
  renderFrameDurations: RunningAverage

  constructor(config: {
    canvas3d: HTMLCanvasElement
    canvas2d: HTMLCanvasElement
    debugDraw: IDebugDrawWriter & IDebugDrawReader
  }) {
    this.renderer3d = new Renderer3d(config.canvas3d)
    this.renderer2d = new Renderer2d(config.canvas2d)
    this.debugDraw = config.debugDraw

    this.lastRenderAt = time.current()
    this.renderDurations = new RunningAverage(3 * 60)
    this.renderFrameDurations = new RunningAverage(3 * 60)
  }

  getModelLoader(): IModelLoader {
    return this.renderer3d
  }

  setViewportDimensions(d: Immutable<vec2>): void {
    this.renderer2d.setViewportDimensions(d)
    this.renderer3d.setViewportDimensions(d)
  }

  update(params: {
    world2ViewTransform: mat4
    renderables3dOld: Renderable3dOld[]
    renderables3dSolid: Renderable3dSolid[]
  }): void {
    const now = time.current()
    this.renderFrameDurations.sample(now - this.lastRenderAt)
    this.lastRenderAt = now

    this.renderer3d.clear()
    this.renderer3d.setWvTransform(params.world2ViewTransform)

    this.renderer3d.renderVColor(params.renderables3dOld)
    this.renderer3d.renderWiresolid(params.renderables3dSolid)

    // World-space debug draw
    this.renderer3d.renderUnlit(this.debugDraw.get3d().map((obj) => obj.object))

    // Screenspace debug draw
    this.renderer2d.clear()
    this.renderer2d.setTransform(mat2d.identity(mat2d.create()))
    for (const r of this.debugDraw.get2d()) {
      this.renderer2d.render(r)
    }

    this.renderDurations.sample(time.current() - now)
  }
}
