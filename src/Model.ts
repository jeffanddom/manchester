import { mat2d, vec2 } from 'gl-matrix'

import { transformCircle } from './util/math'

import { Primitive, Renderable } from '~/renderer/interfaces'

export enum ModelPrimitive {
  PATH = 0,
  CIRCLE = 1,
  LINE = 2,
}

export interface ModelPath {
  primitive: ModelPrimitive.PATH
  path: Array<vec2>
  fillStyle: string
}

export interface ModelCircle {
  primitive: ModelPrimitive.CIRCLE
  radius: number
  fillStyle: string
}

export interface ModelLine {
  primitive: ModelPrimitive.LINE
  from: vec2
  to: vec2
  style: string
  width: number
}

// TODO:
// - have notion of sort order for items
// - allow items to be offset from model origin
export type ModelItem = ModelPath | ModelCircle | ModelLine

export type Model = { [key: string]: ModelItem }

export const toRenderables = (
  model: Model,
  opts: {
    worldTransform?: mat2d
    itemTransforms?: { [key: string]: mat2d }
    itemFillStyles?: { [key: string]: string }
  },
): Renderable[] => {
  const worldTransform = opts.worldTransform || mat2d.identity(mat2d.create())
  const itemTransforms = opts.itemTransforms || {}
  const fillStyles = opts.itemFillStyles || {}

  const result: Array<Renderable> = []
  for (const k in model) {
    const mwTransform = mat2d.create()
    if (itemTransforms[k] !== undefined) {
      mat2d.copy(mwTransform, itemTransforms[k])
    } else {
      mat2d.identity(mwTransform)
    }

    mat2d.multiply(mwTransform, worldTransform, mwTransform)

    switch (model[k].primitive) {
      case ModelPrimitive.PATH:
        {
          const r = model[k] as ModelPath
          result.push({
            primitive: Primitive.PATH,
            path: r.path,
            mwTransform,
            fillStyle: fillStyles[k] || r.fillStyle,
          })
        }
        break

      case ModelPrimitive.CIRCLE:
        {
          const r = model[k] as ModelCircle
          const c = transformCircle(
            { pos: vec2.create(), radius: r.radius },
            mwTransform,
          )
          result.push({
            primitive: Primitive.CIRCLE,
            pos: c.pos,
            radius: c.radius,
            fillStyle: fillStyles[k] || r.fillStyle,
          })
        }
        break
      case ModelPrimitive.LINE:
        {
          const r = model[k] as ModelLine
          result.push({
            primitive: Primitive.LINE,
            from: vec2.transformMat2d(vec2.create(), r.from, mwTransform),
            to: vec2.transformMat2d(vec2.create(), r.to, mwTransform),
            style: r.style,
            width: r.width,
          })
        }
        break
    }
  }

  return result
}
