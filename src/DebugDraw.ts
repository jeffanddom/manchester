import { Renderable2d } from '~/renderer/Renderer2d'
import { UnlitObject } from '~/renderer/Renderer3d'

export interface DebugDrawObject {
  object: UnlitObject
  lifetime?: number // lifetime in frames (minimum 1, default 1)
}

export interface IDebugDrawWriter {
  draw2d: (makeRenderables: () => Renderable2d[]) => void
  draw3d: (makeModels: () => DebugDrawObject[]) => void
}

export interface IDebugDrawReader {
  get2d: () => Renderable2d[]
  get3d: () => UnlitObject[]
}

export const mockDebugDraw = {
  draw2d: (_makeRenderables: () => Renderable2d[]): void => {
    /* do nothing */
  },
  draw3d: (_makeModels: () => DebugDrawObject[]): void => {
    /* do nothing */
  },
}

export class DebugDraw implements IDebugDrawWriter, IDebugDrawReader {
  private debugDraw2dRenderables: Renderable2d[]
  private debugDraw3dModels: DebugDrawObject[]
  private enabled: boolean

  constructor() {
    this.debugDraw2dRenderables = []
    this.debugDraw3dModels = []
    this.enabled = true
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  draw2d(makeRenderables: () => Renderable2d[]): void {
    if (!this.enabled) {
      return
    }

    this.debugDraw2dRenderables = this.debugDraw2dRenderables.concat(
      makeRenderables(),
    )
  }

  draw3d(makeModels: () => DebugDrawObject[]): void {
    if (!this.enabled) {
      return
    }

    this.debugDraw3dModels = this.debugDraw3dModels.concat(makeModels())
  }

  get2d(): Renderable2d[] {
    return this.enabled ? this.debugDraw2dRenderables : []
  }

  get3d(): UnlitObject[] {
    return this.enabled ? this.debugDraw3dModels.map((obj) => obj.object) : []
  }

  update(): void {
    const nextDebugDraw3d = []
    if (this.enabled) {
      for (const m of this.debugDraw3dModels) {
        if (m.lifetime !== undefined && m.lifetime > 1) {
          m.lifetime -= 1
          nextDebugDraw3d.push(m)
        }
      }
    }

    this.debugDraw2dRenderables = []
    this.debugDraw3dModels = nextDebugDraw3d
  }
}
