import { TILE_SIZE } from '~/constants'
import { cube } from './cube'

const models = {
  wall: cube,
  tank: cube,
  turret: cube,
  tree: cube,
}

type ModelTypes = keyof typeof models
type Model = {
  vertices: Float32Array,
  colors: Float32Array,
}

const defaultColor : Float32Array = new Float32Array([0.5, 0.5, 0.5, 1.0])

export const getModel : (model: ModelTypes) => Model = (model) => {
  const obj = models[model]

  const vertices : number[] = []
  const colors : number[] = []

  const points : number[][] = []
  obj.split('\n').forEach(line => {
    if (!line) { return }

    const components = line.split(/\s+/)

    if (components[0] === 'v') {
      const point = [
        parseFloat(components[1]) * TILE_SIZE,
        parseFloat(components[2]) * TILE_SIZE,
        parseFloat(components[3]) * TILE_SIZE
      ]
      points.push(point)
    }

    if (components[0] === 'f') {
      vertices.push(
        ...points[parseInt(components[1]) - 1],
        ...points[parseInt(components[2]) - 1],
        ...points[parseInt(components[3]) - 1]
      )

      colors.push(
        ...defaultColor, ...defaultColor, ...defaultColor,
        ...defaultColor, ...defaultColor, ...defaultColor,
      )
    }
  })

  return {
    vertices: new Float32Array(vertices),
    colors: new Float32Array(colors)
  }
}