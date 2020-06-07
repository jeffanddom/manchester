import { vec2 } from 'gl-matrix'

import * as entities from '~entities'
import * as convert from '~util/convert'

export enum Terrain {
  Mountain,
  River,
  Grass,
  Unknown,
}

export type RawMap = {
  dimensions: convert.RawVec2
  terrain: number[]
  entities: string[]
}

export class Map {
  dimensions: vec2 // width/height in tiles
  origin: vec2 // tile coordinate of NW tile
  terrain: (Terrain | null)[]
  entities: (entities.types.Type | null)[]

  public static fromRaw(rawMap: RawMap): Map {
    const m = new Map(convert.toVec2(rawMap.dimensions))

    m.terrain = rawMap.terrain.map((raw) => {
      if (raw === null) {
        return null
      }
      return convert.toIntEnum(Terrain, raw).unwrap()
    })

    m.entities = rawMap.entities.map((raw) => {
      if (raw === null) {
        return null
      }
      return convert.toStringEnum(entities.types.Type, raw).unwrap()
    })

    return m
  }

  constructor(dimensions: vec2) {
    this.dimensions = dimensions
    this.origin = vec2.fromValues(
      -Math.floor(this.dimensions[0] * 0.5),
      -Math.floor(this.dimensions[0] * 0.5),
    )
    this.terrain = new Array(dimensions[0] * dimensions[1]).fill(null)
    this.entities = new Array(dimensions[0] * dimensions[1]).fill(null)
  }
}
