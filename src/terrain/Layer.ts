import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { ModelPrimitive } from '~/renderer/interfaces'
import { ModelDef } from '~/renderer/interfacesOld'
import { Type } from '~/terrain/Type'

export class Layer {
  private tileOrigin: vec2
  private tileDimensions: vec2
  private terrain: (Type | null)[]

  private vertices: Float32Array
  private colors: Float32Array
  private normals: Float32Array

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
    this.vertices = new Float32Array(this.terrain.length * 18)
    this.colors = new Float32Array(this.terrain.length * 24)
    this.normals = new Float32Array(this.terrain.length * 18)

    for (let i = 0; i < this.terrain.length; i++) {
      const y = Math.floor(i / this.tileDimensions[1])
      const x = i % this.tileDimensions[1]
      const pos = this.t2w([x, y])

      const nw = [pos[0], 0, pos[1]]
      const ne = [pos[0] + TILE_SIZE, 0, pos[1]]
      const sw = [pos[0], 0, pos[1] + TILE_SIZE]
      const se = [pos[0] + TILE_SIZE, 0, pos[1] + TILE_SIZE]

      // prettier-ignore
      this.vertices.set(
        [...nw, ...se, ...ne,
        ...nw, ...sw, ...se], i * 18
      )

      const colors: { [key: number]: [number, number, number, number] } = {
        [Type.Grass]: [126 / 255, 200 / 255, 80 / 255, 1.0],
        [Type.Mountain]: [91 / 255, 80 / 255, 54 / 255, 1.0],
        [Type.River]: [43 / 255, 87 / 255, 112 / 255, 1.0],
      }
      const c = colors[tiles[i] ?? Type.Grass]

      // prettier-ignore
      this.colors.set([
        ...c, ...c, ...c,
        ...c, ...c, ...c,
      ], i * 24)

      // prettier-ignore
      this.normals.set(
        [
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
        ], i * 18
      )
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

  public getModel(): ModelDef {
    return {
      positions: this.vertices,
      colors: this.colors,
      normals: this.normals,
      primitive: ModelPrimitive.Triangles,
    }
  }
}
