import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IGame, IEntity, IGenericComponent } from './common'
import { path2 } from './path2'
import { Entity } from './Entity'
import { Transform } from './Transform'

const PLAYER_SHAPE = path2.fromValues([
  [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
])

class WallComponent implements IGenericComponent {
  update(entity: IEntity): void {}
}

export class Wall extends Entity {
  id?: string
  game?: IGame

  constructor() {
    super()
    this.transform = new Transform()
    this.wall = new WallComponent()
  }

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(PLAYER_SHAPE, this.transform.orientation),
      this.transform.position,
    )

    ctx.fillStyle = '#666'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
