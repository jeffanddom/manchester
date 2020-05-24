import { Terrain, Tile, IPlayfield } from '~/interfaces'
import { TILE_SIZE } from '~/constants'
import { vec2 } from 'gl-matrix'
import { Camera } from '~/Camera'

const terrainByEncoding: { [key: string]: Terrain } = {
  '.': Terrain.Grass,
  '~': Terrain.River,
  '^': Terrain.Mountain,
}

const deserializeTerrain = (s: string): Terrain => {
  const t = terrainByEncoding[s]
  if (t === undefined) {
    return Terrain.Unknown
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

  tileHeight() {
    return this.tiles.length
  }

  tileWidth() {
    return this.tiles[0].length
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

  dimensions(): [number, number] {
    return [this.tileWidth() * TILE_SIZE, this.tileHeight() * TILE_SIZE]
  }

  render(ctx: CanvasRenderingContext2D, camera: Camera) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    for (let i = 0; i < this.tileHeight(); i++) {
      const y = i * TILE_SIZE
      for (let j = 0; j < this.tileWidth(); j++) {
        const x = j * TILE_SIZE
        switch (this.tiles[i][j].type) {
          case Terrain.Grass:
            ctx.fillStyle = '#7EC850'
            break
          case Terrain.Mountain:
            ctx.fillStyle = '#5B5036'
            break
          case Terrain.River:
            ctx.fillStyle = '#2B5770'
            break
          case Terrain.Unknown:
            ctx.fillStyle = '#FF00FF'
            break
        }

        const renderPos = camera.toRenderPos(vec2.fromValues(x, y))
        ctx.fillRect(renderPos[0], renderPos[1], TILE_SIZE, TILE_SIZE)
      }
    }
  }
}
