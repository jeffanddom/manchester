import { mat2d, mat4, vec4 } from 'gl-matrix'

import { IDebugDrawReader, IDebugDrawWriter } from '~/engine/DebugDraw'
import { ModelModifiers } from '~/engine/renderer/interfaces'
import { IModelLoader } from '~/engine/renderer/ModelLoader'
import { Renderable2d, Renderer2d } from '~/engine/renderer/Renderer2d'
import { Renderer3d, UnlitObject } from '~/engine/renderer/Renderer3d'
import { Immutable } from '~/types/immutable'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export enum RenderableType {
  VColor, // per-vertex coloring
  UniformColor, // uniform coloring
  Unlit,
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

interface RenderableUnlit {
  type: RenderableType.Unlit
  object: UnlitObject
}

export type Renderable =
  | RenderableVColor
  | RenderableUniformColor
  | RenderableUnlit

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
    fov: number,
    renderables2d: Renderable2d[],
  ): void {
    const now = time.current()
    this.renderFrameDurations.sample(now - this.lastRenderAt)
    this.lastRenderAt = now

    this.renderer3d.clear()
    this.renderer3d.setWvTransform(world2ViewTransform)
    this.renderer3d.setFov(fov)

    const vcolor: RenderableVColor[] = []
    const uniformColor: RenderableUniformColor[] = []
    const unlit: UnlitObject[] = []
    for (const r of renderables) {
      switch (r.type) {
        case RenderableType.VColor:
          vcolor.push(r)
          break
        case RenderableType.UniformColor:
          uniformColor.push(r)
          break
        case RenderableType.Unlit:
          unlit.push(r.object)
          break
      }
    }

    this.renderer3d.renderVColor(vcolor)
    this.renderer3d.renderWiresolid(uniformColor)
    this.renderer3d.renderUnlit(unlit)

    this.renderer2d.clear()
    this.renderer2d.setTransform(mat2d.identity(mat2d.create()))
    for (const r of renderables2d) {
      this.renderer2d.render(r)
    }

    // Debug draw
    //////////////////////////

    // World-space (grid, hitboxes, etc)
    this.renderer3d.renderUnlit(this.debugDraw.get3d())

    // Screenspace (game stats)
    for (const r of this.debugDraw.get2d()) {
      this.renderer2d.render(r)
    }

    this.renderDurations.sample(time.current() - now)
  }
}
