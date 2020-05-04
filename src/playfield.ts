import {
  Terrain,
  Tile,
  PLAYFIELD_TILE_HEIGHT,
  PLAYFIELD_TILE_WIDTH,
  TILE_SIZE,
} from './common'

export class Playfield {
  tiles: Tile[][]

  constructor() {
    this.tiles = []
    for (let i = 0; i < PLAYFIELD_TILE_HEIGHT; i++) {
      const row: Tile[] = []
      this.tiles[i] = row
      for (let j = 0; j < PLAYFIELD_TILE_WIDTH; j++) {
        row[j] = { type: Terrain.Grass }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    for (let i = 0; i < PLAYFIELD_TILE_HEIGHT; i++) {
      const y = i * TILE_SIZE
      for (let j = 0; j < PLAYFIELD_TILE_WIDTH; j++) {
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
        }
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
      }
    }
  }
}
