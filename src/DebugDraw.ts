import { Renderable2d } from '~/renderer/Renderer2d'
import { WireObject } from '~/renderer/Renderer3d'

export interface DebugDrawObject {
  object: WireObject
  lifetime?: number // lifetime in frames (minimum 1, default 1)
}

export interface DebugDraw {
  draw2d: (makeRenderables: () => Renderable2d[]) => void
  draw3d: (makeModels: () => DebugDrawObject[]) => void
}

export const mockDebugDraw = {
  draw2d: (_makeRenderables: () => Renderable2d[]): void => {
    /* do nothing */
  },
  draw3d: (_makeModels: () => DebugDrawObject[]): void => {
    /* do nothing */
  },
}
