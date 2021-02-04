import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { MeshPrimitive, ModelNode } from '~/renderer/interfaces'
import { Type } from '~/terrain/Type'

export class Layer {
  private tileOrigin: vec2
  private tileDimensions: vec2
  private terrain: (Type | null)[]

  private positions: Float32Array
  private colors: Float32Array
  private normals: Float32Array
  private indices: Uint16Array

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
    this.positions = new Float32Array(this.terrain.length * 4 * 3)
    this.colors = new Float32Array(this.terrain.length * 4 * 4)
    this.normals = new Float32Array(this.terrain.length * 4 * 3)
    this.indices = new Uint16Array(this.terrain.length * 6)

    for (let i = 0; i < this.terrain.length; i++) {
      const y = Math.floor(i / this.tileDimensions[1])
      const x = i % this.tileDimensions[1]
      const pos = this.t2w([x, y])

      const nw = [pos[0], 0, pos[1]]
      const ne = [pos[0] + TILE_SIZE, 0, pos[1]]
      const sw = [pos[0], 0, pos[1] + TILE_SIZE]
      const se = [pos[0] + TILE_SIZE, 0, pos[1] + TILE_SIZE]

      this.positions.set([...nw, ...ne, ...sw, ...se], i * 4 * 3)

      // prettier-ignore
      this.indices.set([
        i * 4, i * 4 + 3, i * 4 + 1, // nw->se->ne
        i * 4, i * 4 + 2, i * 4 + 3, // nw->sw->se
      ], i * 6)

      const colors: { [key: number]: [number, number, number, number] } = {
        [Type.Grass]: [126 / 255, 200 / 255, 80 / 255, 1.0],
        [Type.Mountain]: [91 / 255, 80 / 255, 54 / 255, 1.0],
        [Type.River]: [43 / 255, 87 / 255, 112 / 255, 1.0],
      }
      const c = colors[tiles[i] ?? Type.Grass]
      this.colors.set([...c, ...c, ...c, ...c], i * 4 * 4)

      // prettier-ignore
      this.normals.set(
        [
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
        ], i * 4 * 3
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

  public getModel(): ModelNode {
    return {
      name: 'root',
      mesh: {
        primitive: MeshPrimitive.Triangles,
        positions: {
          bufferData: this.positions,
          glType: 5126 as GLenum, // gl.FLOAT
          componentCount: this.positions.length,
          componentsPerAttrib: 3,
        },
        colors: {
          bufferData: this.colors,
          glType: 5126 as GLenum, // gl.FLOAT
          componentCount: this.colors.length,
          componentsPerAttrib: 4,
        },
        normals: {
          bufferData: this.normals,
          glType: 5126 as GLenum, // gl.FLOAT
          componentCount: this.normals.length,
          componentsPerAttrib: 3,
        },
        indices: {
          bufferData: new Uint16Array(this.indices),
          glType: 5123 as GLenum, // gl.USHORT
          componentCount: this.indices.length,
          componentsPerAttrib: 1,
        },
      },
      children: [],
    }
  }
}
