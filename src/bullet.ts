import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IGame, IEntity } from './common'
import { path2 } from './path2'

const BULLET_SHAPE = path2.fromValues([
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
])

const BULLET_SPEED = vec2.fromValues(0, -10)
const TIME_TO_LIVE = 500

export class Bullet implements IEntity {
  id?: string
  game?: IGame
  position: vec2
  orientation: number

  spawnedAt: number

  constructor(position, orientation) {
    this.position = vec2.copy(vec2.create(), position)
    this.orientation = orientation
    this.spawnedAt = Date.now()
  }

  update() {
    if (Date.now() - this.spawnedAt > TIME_TO_LIVE) {
      this.game.entities.markForDeletion(this)
    }

    this.position = vec2.add(
      this.position,
      this.position,
      vec2.rotate(vec2.create(), BULLET_SPEED, [0, 0], this.orientation),
    )
  }

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(BULLET_SHAPE, this.orientation),
      this.position,
    )

    ctx.fillStyle = '#FF00FF'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
