import { wall } from './wall'
import { tree } from './tree'
import { turret } from './turret'
import { tank } from './tank'
import { bullet } from './bullet'
import { TILE_SIZE } from '~/constants'

const models : {[key: string]: {
  model: string,
  scale: number,
  translate?: [number, number, number]
}} = {
  wall: wall,
  tank: tank,
  turret: turret,
  tree: tree,
  bullet: bullet,
}

const materials : {[key: string]: [number, number, number, number]}= {
  tree: [0, 100/255, 0, 1.0],
  tank: [0, 0, 0, 1.0],
  bullet: [1.0, 0, 0, 1.0],
  wall: [169/255, 169/255, 169/255, 1.0],
  turret: [1.0, 250/255, 205/255, 1.0],
  debug: [0, 1.0, 1.0, 1.0],
}

type ModelTypes = keyof typeof models
type Model = {
  vertices: Float32Array,
  colors: Float32Array,
}

const defaultColor = [1.0, 0, 1.0, 1.0]

export const getModel : (model: ModelTypes) => Model = (model) => {
  const obj = models[model]

  const vertices : number[] = []
  const colors : number[] = []

  const points : number[][] = []

  let currentColor = defaultColor
  obj.model.split('\n').forEach(line => {
    if (!line) { return }

    const components = line.split(/\s+/)
    const translate = obj.translate ?? [0,0,0]

    if (components[0] === 'v') {
      const point = [
        (parseFloat(components[1]) + translate[0]) * obj.scale,
        (parseFloat(components[2]) + translate[1]) * obj.scale,
        (parseFloat(components[3]) + translate[2]) * obj.scale
      ]
      points.push(point)
    }

    if (components[0] === 'usemtl') {
      currentColor = materials[components[1]] || defaultColor
    }

    if (components[0] === 'f') {
      vertices.push(
        ...points[parseInt(components[1]) - 1],
        ...points[parseInt(components[2]) - 1],
        ...points[parseInt(components[3]) - 1]
      )

      colors.push(
        ...currentColor, ...currentColor, ...currentColor,
        ...currentColor, ...currentColor, ...currentColor,
      )
    }
  })

  return {
    vertices: new Float32Array(vertices),
    colors: new Float32Array(colors)
  }
}

export const loadGrid = () => {
  const vertices = []
  const colors = []

  const y = 0.01
  for (let i = -32; i < 32; i++) {
    vertices.push(
      -32*TILE_SIZE, y, i*TILE_SIZE,
      32*TILE_SIZE, y, i*TILE_SIZE,
    )
    colors.push(...materials.debug, ...materials.debug)
  }
  for (let i = -32; i < 32; i++) {
    vertices.push(
      i*TILE_SIZE, y, -32*TILE_SIZE,
      i*TILE_SIZE, y, 32*TILE_SIZE,
    )
    colors.push(...materials.debug, ...materials.debug)
  }

  return {
    vertices: new Float32Array(vertices),
    colors: new Float32Array(colors),
    primitive: 'LINES',
  }
}