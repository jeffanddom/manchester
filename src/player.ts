import { Position, TILE_SIZE } from './common'
export class Player {
  position: Position
  orientation: number

  constructor() {
    this.position = { x: 136, y: 136 }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#000000'
    ctx.beginPath()

    ctx.moveTo(this.position.x, this.position.y - TILE_SIZE * 0.5)
    ctx.lineTo(
      this.position.x + TILE_SIZE * 0.3,
      this.position.y + TILE_SIZE * 0.5,
    )
    ctx.lineTo(
      this.position.x - TILE_SIZE * 0.3,
      this.position.y + TILE_SIZE * 0.5,
    )
    ctx.fill()
  }
}
