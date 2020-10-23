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
          fillStyle = '#7EC850'
          break
        case Type.Mountain:
          fillStyle = '#5B5036'
          break
        case Type.River:
          fillStyle = '#2B5770'
          break
        case Type.Unknown:
          fillStyle = '#FF00FF'
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

  private w2t(worldpos: vec2): vec2 {
    return vec2.fromValues(
      Math.floor(worldpos[0] / TILE_SIZE) - this.tileOrigin[0],
      Math.floor(worldpos[1] / TILE_SIZE) - this.tileOrigin[1],
    )
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
  public getRenderables(visibleExtents: [vec2, vec2]): Renderable[] {
    const tmin = this.w2t(visibleExtents[0])
    const tmax = this.w2t(visibleExtents[1])
    const renderables: Renderable[] = []

    for (let i = tmin[1]; i <= tmax[1]; i++) {
      for (let j = tmin[0]; j <= tmax[0]; j++) {
        const n = i * this.tileDimensions[0] + j
        if (this.renderables[n]) {
          renderables.push(this.renderables[n])
        }
      }
    }

    return renderables
  }
}
