import { Terrain, Tile, IPlayfield } from './interfaces'
import { TILE_SIZE } from './constants'

const terrainByEncoding = {
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

  height() {
    return this.tiles.length
  }

  pixelHeight() {
    return this.height() * TILE_SIZE
  }

  width() {
    return this.tiles[0].length
  }

  pixelWidth() {
    return this.width() * TILE_SIZE
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    for (let i = 0; i < this.height(); i++) {
      const y = i * TILE_SIZE
      for (let j = 0; j < this.width(); j++) {
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
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
      }
    }
  }
}
