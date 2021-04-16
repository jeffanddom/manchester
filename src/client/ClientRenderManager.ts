import { mat2d, mat4, vec4 } from 'gl-matrix'

import { IDebugDrawReader, IDebugDrawWriter } from '~/DebugDraw'
import { ModelModifiers } from '~/renderer/interfaces'
import { IModelLoader } from '~/renderer/ModelLoader'
import { Renderable2d, Renderer2d } from '~/renderer/Renderer2d'
import { Renderer3d } from '~/renderer/Renderer3d'
import { Immutable } from '~/types/immutable'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export enum RenderableType {
  VColor, // per-vertex coloring
  UniformColor, // uniform coloring
}

interface RenderableBase {
  modelName: string
  modelModifiers: ModelModifiers
  model2World: mat4
}

interface RenderableVColor extends RenderableBase {
  type: RenderableType.VColor
}

interface RenderableUniformColor extends RenderableBase {
  type: RenderableType.UniformColor
  color: Immutable<vec4>
}

export type Renderable = RenderableVColor | RenderableUniformColor

export class ClientRenderManager {
  renderer3d: Renderer3d
  renderer2d: Renderer2d
  debugDraw: IDebugDrawWriter & IDebugDrawReader

  // diagnostic metrics
  lastRenderAt: number
  renderDurations: RunningAverage
  renderFrameDurations: RunningAverage

  constructor(config: {
    gl: WebGL2RenderingContext
    ctx2d: CanvasRenderingContext2D
    debugDraw: IDebugDrawWriter & IDebugDrawReader
  }) {
    this.renderer3d = new Renderer3d(config.gl)
    this.renderer2d = new Renderer2d(config.ctx2d)
    this.debugDraw = config.debugDraw

    this.lastRenderAt = time.current()
    this.renderDurations = new RunningAverage(3 * 60)
    this.renderFrameDurations = new RunningAverage(3 * 60)
  }

  getModelLoader(): IModelLoader {
    return this.renderer3d
  }

  syncViewportDimensions(): void {
    this.renderer3d.syncViewportDimensions()
  }

  update(
    renderables: Renderable[],
    world2ViewTransform: mat4,
    renderables2d: Renderable2d[],
  ): void {
    const now = time.current()
    this.renderFrameDurations.sample(now - this.lastRenderAt)
    this.lastRenderAt = now

    this.renderer3d.clear()
    this.renderer3d.setWvTransform(world2ViewTransform)

    const vcolor: RenderableVColor[] = []
    const uniformColor: RenderableUniformColor[] = []
    for (const r of renderables) {
      switch (r.type) {
        case RenderableType.VColor:
          vcolor.push(r)
          break
        case RenderableType.UniformColor:
          uniformColor.push(r)
          break
      }
    }

    this.renderer3d.renderVColor(vcolor)
    this.renderer3d.renderWiresolid(uniformColor)

    // World-space debug draw
    this.renderer3d.renderUnlit(this.debugDraw.get3d())

    // Screenspace debug draw
    this.renderer2d.clear()
    this.renderer2d.setTransform(mat2d.identity(mat2d.create()))
    for (const r of renderables2d) {
      this.renderer2d.render(r)
    }
    for (const r of this.debugDraw.get2d()) {
      this.renderer2d.render(r)
    }

    this.renderDurations.sample(time.current() - now)
  }
}
