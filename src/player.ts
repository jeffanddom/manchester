import { TILE_SIZE } from './common'
import { Entity, EntityManager } from './entity'
import { Bullet } from './bullet'
import { vec2 } from 'gl-matrix'

const PLAYER_SHAPE = [
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
]

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

const PLAYER_SPEED = [0, -2]

export class Player implements Entity {
  id?: number
  manager?: EntityManager

  position: vec2
  orientation: number
  keyDown: Set<number>
  lastFiredAt: number

  constructor() {
    this.orientation = Math.PI / 2
    this.position = vec2.create()
    this.lastFiredAt = -1
    vec2.add(this.position, this.position, [100, 100])

    this.keyDown = new Set()
    document.addEventListener('focusout', () => {
      this.keyDown.clear()
    })
    document.addEventListener('keydown', (event) => {
      this.keyDown.add(event.which)
    })
    document.addEventListener('keyup', (event) => {
      this.keyDown.delete(event.which)
    })
  }

  update() {
    if (this.keyDown.has(keyMap.space)) {
      if (Date.now() - this.lastFiredAt > 150) {
        this.manager.register(new Bullet(this.position, this.orientation))
        this.lastFiredAt = Date.now()
      }
    }
    if (this.keyDown.has(keyMap.up)) {
      this.position = vec2.add(
        this.position,
        this.position,
        vec2.rotate(
          vec2.create(),
          [PLAYER_SPEED[0], PLAYER_SPEED[1]],
          [0, 0],
          this.orientation,
        ),
      )
    }
    if (this.keyDown.has(keyMap.right)) {
      this.orientation += 0.1
    }
    if (this.keyDown.has(keyMap.left)) {
      this.orientation -= 0.1
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const mappedPoints = PLAYER_SHAPE.map((point) => {
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

    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo(mappedPoints[0][0], mappedPoints[0][1])
    ctx.lineTo(mappedPoints[1][0], mappedPoints[1][1])
    ctx.lineTo(mappedPoints[2][0], mappedPoints[2][1])
    ctx.fill()
  }
}
