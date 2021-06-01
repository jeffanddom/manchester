import { vec2 } from 'gl-matrix'

import { MeshPrimitive, ModelNode } from '~/engine/renderer/interfaces'
import { ShaderAttrib } from '~/engine/renderer/shaders/common'
import { Type } from '~/engine/terrain/Type'

export class Layer {
  private tileOrigin: vec2
  private tileDimensions: vec2
  private tileSize: number
  private terrain: (Type | null)[]

  private positions: Float32Array
  private colors: Float32Array
  private normals: Float32Array
  private indices: Uint16Array

  public constructor({
    tileOrigin: origin,
    tileDimensions: dimensions,
    tileSize,
    terrain: tiles,
  }: {
    tileOrigin: vec2 // tile units
    tileDimensions: vec2 // tile units
    tileSize: number // worldspace units
    terrain: (Type | null)[]
  }) {
    this.tileOrigin = origin
    this.tileDimensions = dimensions
    this.tileSize = tileSize
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
      const ne = [pos[0] + this.tileSize, 0, pos[1]]
      const sw = [pos[0], 0, pos[1] + this.tileSize]
      const se = [pos[0] + this.tileSize, 0, pos[1] + this.tileSize]

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
      (tilepos[0] + this.tileOrigin[0]) * this.tileSize,
      (tilepos[1] + this.tileOrigin[1]) * this.tileSize,
    )
  }

  public minWorldPos(): vec2 {
    return vec2.scale(vec2.create(), this.tileOrigin, this.tileSize)
  }

  public maxWorldPos(): vec2 {
    return vec2.add(vec2.create(), this.minWorldPos(), this.dimensions())
  }

  public dimensions(): vec2 {
    return vec2.scale(vec2.create(), this.tileDimensions, this.tileSize)
  }

  public getModel(): ModelNode {
    const attribBuffers = new Map()
    attribBuffers.set(ShaderAttrib.Position, {
      bufferData: this.positions,
      componentsPerAttrib: 3,
    })
    attribBuffers.set(ShaderAttrib.VertexColor, {
      bufferData: this.colors,
      componentsPerAttrib: 4,
    })
    attribBuffers.set(ShaderAttrib.Normal, {
      bufferData: this.normals,
      componentsPerAttrib: 3,
    })

    return {
      name: 'root',
      meshes: [
        {
          primitive: MeshPrimitive.Triangles,
          attribBuffers,
          indices: {
            bufferData: new Uint16Array(this.indices),
            componentsPerAttrib: 1,
          },
        },
      ],
      children: [],
    }
  }
}
