import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Primitive, Renderable } from '~/renderer/interfaces'
import { Type } from '~/terrain/Type'

export class Layer {
  private tileOrigin: vec2
  private tileDimensions: vec2
  private terrain: (Type | null)[]
  private renderables: Renderable[]

  public constructor({
    tileOrigin: origin,
    tileDimensions: dimensions,
    terrain: tiles,
  }: {
    tileOrigin: vec2 // tile units
    tileDimensions: vec2 // tile units
    terrain: (Type | null)[]
  }) {
    this.tileOrigin = origin
    this.tileDimensions = dimensions
    this.terrain = tiles
    this.renderables = new Array(this.terrain.length)

    for (let i = 0; i < this.terrain.length; i++) {
      const tile = this.terrain[i]
      if (tile === null) {
        continue
      }

      let fillStyle
      switch (tile) {
        case Type.Grass:
          fillStyle = 'green'
          break
        case Type.Mountain:
          fillStyle = 'brown'
          break
        case Type.River:
          fillStyle = 'blue'
          break
        case Type.Unknown:
          fillStyle = 'magenta'
          break
      }

      const y = Math.floor(i / this.tileDimensions[1])
      const x = i % this.tileDimensions[1]

      this.renderables[i] = {
        primitive: Primitive.RECT,
        fillStyle: fillStyle,
        pos: this.t2w([x, y]),
        dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
      }
    }
  }

  private t2w(tilepos: vec2): vec2 {
    return vec2.fromValues(
      (tilepos[0] + this.tileOrigin[0]) * TILE_SIZE,
      (tilepos[1] + this.tileOrigin[1]) * TILE_SIZE,
    )
  }

  public minWorldPos(): vec2 {
    return vec2.scale(vec2.create(), this.tileOrigin, TILE_SIZE)
  }

  public maxWorldPos(): vec2 {
    return vec2.add(vec2.create(), this.minWorldPos(), this.dimensions())
  }

  public dimensions(): vec2 {
    return vec2.scale(vec2.create(), this.tileDimensions, TILE_SIZE)
  }

  /**
   * Returns renderables for the worldspace area described by the given
   * AABB.
   */
  public getRenderables(): Renderable[] {
    return this.renderables
  }
}
