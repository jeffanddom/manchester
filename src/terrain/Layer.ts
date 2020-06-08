import { vec2 } from 'gl-matrix'

import { Type } from '~terrain/Type'
import { Renderable, Primitive } from '~renderer/interfaces'
import { TILE_SIZE } from '~constants'

export class Layer {
  private tileOrigin: vec2
  private tileDimensions: vec2
  private terrain: (Type | null)[]

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
  }

  private w2t(worldpos: vec2): vec2 {
    return vec2.fromValues(
      Math.floor(worldpos[0] / TILE_SIZE) - this.tileOrigin[0],
      Math.floor(worldpos[1] / TILE_SIZE) - this.tileOrigin[1],
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
    const worldOrigin = this.minWorldPos()
    const renderables: Renderable[] = []

    for (let i = tmin[1]; i <= tmax[1]; i++) {
      const y = worldOrigin[1] + i * TILE_SIZE

      for (let j = tmin[0]; j <= tmax[0]; j++) {
        const x = worldOrigin[0] + j * TILE_SIZE
        const n = i * this.tileDimensions[0] + j

        const tile = this.terrain[n]
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
