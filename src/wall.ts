import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IGame, IEntity } from './common'
import { path2 } from './path2'

const PLAYER_SHAPE = path2.fromValues([
  [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
])

export class Wall implements IEntity {
  id?: string
  game?: IGame
  position: vec2
  orientation: number

  constructor() {
    this.orientation = 0
    this.position = vec2.create()
  }

  update() {}

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(PLAYER_SHAPE, this.orientation),
      this.position,
    )

    ctx.fillStyle = '#666'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
