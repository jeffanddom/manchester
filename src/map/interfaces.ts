import { vec2 } from 'gl-matrix'

import * as entities from '~/entities'

export enum Terrain {
  Mountain,
  River,
  Grass,
  Unknown,
}

export class Map {
  dimensions: vec2 // width/height in tiles
  origin: vec2 // tile coordinate of NW tile
  terrain: Terrain[]
  entities: entities.types.Type[]

  constructor(dimensions: vec2) {
    this.dimensions = dimensions
    this.origin = vec2.negate(
      vec2.create(),
      vec2.round(vec2.create(), vec2.scale(vec2.create(), dimensions, 0.5)),
    )
    this.terrain = new Array(dimensions[0] * dimensions[1])
    this.entities = new Array(dimensions[0] * dimensions[1])
  }
}
