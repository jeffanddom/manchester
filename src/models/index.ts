import { vec3 } from 'gl-matrix'

import { model as bullet } from '~/models/bullet'
import { model as core } from '~/models/core'
import { model as tank } from '~/models/tank'
import { model as tree } from '~/models/tree'
import { model as turret } from '~/models/turret'
import { model as wall } from '~/models/wall'

export enum ModelPrimitive {
  Lines,
  Triangles,
}

const models: {
  [key: string]: {
    obj: string
    scale: number
    translate?: vec3
  }
} = {
  bullet: bullet,
  core: core,
  tank: tank,
  tree: tree,
  turret: turret,
  wall: wall,
}

const materials: { [key: string]: [number, number, number, number] } = {
  bullet: [1.0, 0, 0, 1.0],
  core: [1.0, 0.5, 0, 1.0],
  debug: [0, 1.0, 1.0, 1.0],
  tank: [0, 0, 0, 1.0],
  tree: [0, 100 / 255, 0, 1.0],
  turret: [1.0, 250 / 255, 205 / 255, 1.0],
  wall: [169 / 255, 169 / 255, 169 / 255, 1.0],
}

type ModelTypes = keyof typeof models
export type Model = {
  primitive: ModelPrimitive
  positions: Float32Array
  colors?: Float32Array
  normals?: Float32Array
}

const defaultColor = [1.0, 0, 1.0, 1.0]

export const getModel: (modelType: ModelTypes) => Model = (modelType) => {
  const obj = models[modelType]

  const vertices: number[] = []
  const colors: number[] = []
  const normals: number[] = []

  const objVerts: number[][] = []
  const objNormals: number[][] = []

  let currentColor = defaultColor
  obj.obj.split('\n').forEach((line) => {
    if (!line) {
      return
    }

    const components = line.split(/\s+/)
    const translate = obj.translate ?? [0, 0, 0]

    if (components[0] === 'v') {
      objVerts.push([
        parseFloat(components[1]) * obj.scale + translate[0],
        parseFloat(components[2]) * obj.scale + translate[1],
        parseFloat(components[3]) * obj.scale + translate[2],
      ])
    }

    if (components[0] === 'vn') {
      objNormals.push([
        parseFloat(components[1]),
        parseFloat(components[2]),
        parseFloat(components[3]),
      ])
    }

    if (components[0] === 'usemtl') {
      currentColor = materials[components[1]] ?? defaultColor
    }

    if (components[0] === 'f') {
      const splitDefs = components
        .slice(1)
        .map((def) => def.split('/').map((n) => parseInt(n) - 1))
      const vertIndices = splitDefs.map((def) => def[0])
      const normIndices =
        line.indexOf('/') > -1 ? splitDefs.map((def) => def[2]) : []

      vertices.push(
        ...objVerts[vertIndices[0]],
        ...objVerts[vertIndices[1]],
        ...objVerts[vertIndices[2]],
      )

      colors.push(
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
        ...currentColor,
      )

      if (normIndices.length > 0) {
        normals.push(
          ...objNormals[normIndices[0]],
          ...objNormals[normIndices[1]],
          ...objNormals[normIndices[2]],
        )
      }
    }
  })

  return {
    positions: new Float32Array(vertices),
    colors: new Float32Array(colors),
    normals: new Float32Array(normals),
    primitive: ModelPrimitive.Triangles,
  }
}
