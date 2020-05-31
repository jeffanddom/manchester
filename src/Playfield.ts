import { Tile, IPlayfield } from '~/interfaces'
import { TILE_SIZE } from '~/constants'
import { vec2 } from 'gl-matrix'
import { Camera } from '~/Camera'
import * as map from '~/map/interfaces'

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

export class Playfield implements IPlayfield {
  tiles: Tile[][]

  constructor(map: string) {
    const rows = map.trim().split('\n')
    const width = rows[0].length

    this.tiles = []
    for (let i = 0; i < rows.length; i++) {
      const row: Tile[] = []
      this.tiles[i] = row
      for (let j = 0; j < width; j++) {
        row[j] = { type: deserializeTerrain(rows[i][j]) }
      }
    }
  }

  tileDimensions(): vec2 {
    return vec2.fromValues(this.tiles[0].length, this.tiles.length)
  }

  minWorldPos(): vec2 {
    return vec2.fromValues(0, 0)
  }

  maxWorldPos(): vec2 {
    const d = this.dimensions()
    return vec2.add(
      vec2.create(),
      this.minWorldPos(),
      vec2.fromValues(d[0], d[1]),
    )
  }

  dimensions(): vec2 {
    return vec2.scale(vec2.create(), this.tileDimensions(), TILE_SIZE)
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera) {
    const [tileWidth, tileHeight] = this.tileDimensions()
    const wvTransform = camera.wvTransform()

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    for (let i = 0; i < tileHeight; i++) {
      const y = i * TILE_SIZE
      for (let j = 0; j < tileWidth; j++) {
        const x = j * TILE_SIZE
        switch (this.tiles[i][j].type) {
          case map.Terrain.Grass:
            ctx.fillStyle = '#7EC850'
            break
          case map.Terrain.Mountain:
            ctx.fillStyle = '#5B5036'
            break
          case map.Terrain.River:
            ctx.fillStyle = '#2B5770'
            break
          case map.Terrain.Unknown:
            ctx.fillStyle = '#FF00FF'
            break
        }

        const renderPos = vec2.transformMat2d(
          vec2.create(),
          vec2.fromValues(x, y),
          wvTransform,
        )
        vec2.floor(renderPos, renderPos) // necessary to avoid render gaps between adjacent tiles
        ctx.fillRect(renderPos[0], renderPos[1], TILE_SIZE, TILE_SIZE)
      }
    }
  }
}
