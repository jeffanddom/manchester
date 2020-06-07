import { TILE_SIZE } from '~/constants'
import { vec2 } from 'gl-matrix'
import * as map from '~/map/interfaces'
import { Primitive, Renderable } from '~/renderer/interfaces'

const terrainByEncoding: { [key: string]: map.Terrain } = {
  '.': map.Terrain.Grass,
  '~': map.Terrain.River,
  '^': map.Terrain.Mountain,
}

const deserializeTerrain = (s: string): map.Terrain => {
  const t = terrainByEncoding[s]
  if (t === undefined) {
    return map.Terrain.Unknown
  }
  return t
}

export class Playfield {
  tileOrigin: vec2 // tile position of NW corner
  tileDimensions: vec2 // width/height in tiles
  terrain: (map.Terrain | null)[]

  constructor({
    tileOrigin,
    tileDimensions,
    terrain,
  }: {
    tileOrigin: vec2
    tileDimensions: vec2
    terrain: (map.Terrain | null)[]
  }) {
    this.tileOrigin = tileOrigin
    this.tileDimensions = tileDimensions
    this.terrain = terrain
  }

  minWorldPos(): vec2 {
    return vec2.scale(vec2.create(), this.tileOrigin, TILE_SIZE)
  }

  maxWorldPos(): vec2 {
    return vec2.add(vec2.create(), this.minWorldPos(), this.dimensions())
  }

  dimensions(): vec2 {
    return vec2.scale(vec2.create(), this.tileDimensions, TILE_SIZE)
  }

  getRenderables(): Renderable[] {
    const renderables: Renderable[] = []
    const minWorldPos = this.minWorldPos()

    for (let i = 0; i < this.tileDimensions[1]; i++) {
      const y = minWorldPos[1] + i * TILE_SIZE

      for (let j = 0; j < this.tileDimensions[0]; j++) {
        const x = minWorldPos[0] + j * TILE_SIZE
        const n = i * this.tileDimensions[0] + j

        let fillStyle = undefined
        switch (this.terrain[n]) {
          case map.Terrain.Grass:
            fillStyle = '#7EC850'
            break
          case map.Terrain.Mountain:
            fillStyle = '#5B5036'
            break
          case map.Terrain.River:
            fillStyle = '#2B5770'
            break
          case map.Terrain.Unknown:
            fillStyle = '#FF00FF'
            break
          default:
            continue
        }

        renderables.push({
          primitive: Primitive.RECT,
          fillStyle: fillStyle,
          pos: vec2.fromValues(x, y),
          dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
        })
      }
    }

    return renderables
  }
}
