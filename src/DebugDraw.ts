import { vec4 } from 'gl-matrix'

import { Renderable2d } from '~/renderer/Renderer2d'

export interface DebugLineModel {
  points: Float32Array
  color: vec4
  lifetime?: number // lifetime in frames (minimum 1, default 1)
}

export interface DebugDraw {
  draw2d: (makeRenderables: () => Renderable2d[]) => void
  draw3d: (makeModels: () => { points: Float32Array; color: vec4 }[]) => void
}

export const mockDebugDraw = {
  draw2d: (_makeRenderables: () => Renderable2d[]): void => {
    /* do nothing */
  },
  draw3d: (
    _makeModels: () => { points: Float32Array; color: vec4 }[],
  ): void => {
    /* do nothing */
  },
}
