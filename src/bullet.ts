import { TILE_SIZE } from './common'
import { Entity, EntityManager } from './entity'
import { vec2 } from 'gl-matrix'

const BULLET_SHAPE = [
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
]

const BULLET_SPEED = [0, -10]
const TIME_TO_LIVE = 500

export class Bullet implements Entity {
  id?: number
  manager?: EntityManager
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
      this.manager.markForDeletion(this)
    }

    this.position = vec2.add(
      this.position,
      this.position,
      vec2.rotate(
        vec2.create(),
        [BULLET_SPEED[0], BULLET_SPEED[1]],
        [0, 0],
        this.orientation,
      ),
    )
  }

  render(ctx: CanvasRenderingContext2D) {
    const mappedPoints = BULLET_SHAPE.map((point) => {
      return vec2.add(
        vec2.create(),
        vec2.rotate(
          vec2.create(),
          [point[0], point[1]],
          [0, 0],
          this.orientation,
        ),
        this.position,
      )
    })

    ctx.fillStyle = '#FF00FF'
    ctx.beginPath()
    ctx.moveTo(mappedPoints[0][0], mappedPoints[0][1])
    ctx.lineTo(mappedPoints[1][0], mappedPoints[1][1])
    ctx.lineTo(mappedPoints[2][0], mappedPoints[2][1])
    ctx.fill()
  }
}
