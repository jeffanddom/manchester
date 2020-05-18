import { vec2 } from 'gl-matrix'
import { TILE_SIZE, IGame, IEntity, IGenericComponent } from './common'
import { path2 } from './path2'
import { Entity } from './Entity'
import { Transform } from './Transform'
import { WallCollider } from './WallCollider'

const BULLET_SHAPE = path2.fromValues([
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
])

const BULLET_SPEED = vec2.fromValues(0, -TILE_SIZE / 8)
const TIME_TO_LIVE = 1000

class BulletScript implements IGenericComponent {
  spawnedAt: number

  constructor() {
    this.spawnedAt = Date.now()
  }

  update(entity: IEntity): void {
    if (entity.wallCollider.hitLastFrame) {
      entity.game.entities.markForDeletion(entity)
      return
    }

    if (Date.now() - this.spawnedAt > TIME_TO_LIVE) {
      entity.game.entities.markForDeletion(entity)
      return
    }

    entity.transform.position = vec2.add(
      entity.transform.position,
      entity.transform.position,
      vec2.rotate(
        vec2.create(),
        BULLET_SPEED,
        [0, 0],
        entity.transform.orientation,
      ),
    )
  }
}

export class Bullet extends Entity {
  constructor(position, orientation) {
    super()

    this.transform = new Transform()
    this.transform.position = vec2.copy(vec2.create(), position)
    this.transform.orientation = orientation

    this.wallCollider = new WallCollider()
    this.script = new BulletScript()
  }

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(BULLET_SHAPE, this.transform.orientation),
      this.transform.position,
    )

    ctx.fillStyle = '#FF00FF'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
