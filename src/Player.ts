import { TILE_SIZE } from './common'
import { Entity } from './Entity'
import { path2 } from './path2'
import { Transform } from './Transform'
import { PlayerControl } from './PlayerControl'
import { Shooter } from './Shooter'
import { WallCollider } from './WallCollider'

const PLAYER_SHAPE = path2.fromValues([
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
])

export class Player extends Entity {
  constructor() {
    super()
    this.transform = new Transform()
    this.playerControl = new PlayerControl()
    this.shooter = new Shooter()
    this.wallCollider = new WallCollider()
  }

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(PLAYER_SHAPE, this.transform.orientation),
      this.transform.position,
    )

    ctx.fillStyle = '#000000'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
