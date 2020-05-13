import { vec2 } from 'gl-matrix'
import { IEntity, IGame, TILE_SIZE, Direction } from './common'
import { Bullet } from './Bullet'
import { path2 } from './path2'
import { tileBox, tileCoords, equals } from './tileMath'

const PLAYER_SHAPE = path2.fromValues([
  [0, -TILE_SIZE * 0.5],
  [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
  [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
])

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

const PLAYER_SPEED = vec2.fromValues(0, -TILE_SIZE/8)

export class Player implements IEntity {
  id?: string
  game?: IGame
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
    const previousPosition = vec2.copy(vec2.create(), this.position)

    // Player movement
    if (this.keyDown.has(keyMap.space)) {
      if (Date.now() - this.lastFiredAt > 150) {
        this.game.entities.register(new Bullet(this.position, this.orientation))
        this.lastFiredAt = Date.now()
      }
    }
    if (this.keyDown.has(keyMap.up)) {
      this.position = vec2.add(
        this.position,
        this.position,
        vec2.rotate(vec2.create(), PLAYER_SPEED, [0, 0], this.orientation),
      )
    }
    if (this.keyDown.has(keyMap.right)) {
      this.orientation += 0.1
    }
    if (this.keyDown.has(keyMap.left)) {
      this.orientation -= 0.1
    }

    // Get all entities colliding with player
    const playerBox = tileBox(this.position)
    const previousBox = tileBox(previousPosition)
    let collided : [IEntity, Direction, number][] = []
    for (let id in this.game.entities.entities) {
      if (id === this.id) {
        continue
      }

      const entity = this.game.entities.entities[id]
      const entityBox = tileBox(entity.position)

      if (playerBox[0][0] < entityBox[1][0] &&
        playerBox[1][0] > entityBox[0][0] &&
        playerBox[0][1] < entityBox[1][1] &&
        playerBox[1][1] > entityBox[0][1]) {
          // North
          if (previousBox[1][1] < entityBox[0][1] && playerBox[1][1] > entityBox[0][1]) {
            collided.push([entity, Direction.North, entityBox[0][1]])
          }
          // South
          if (previousBox[0][1] > entityBox[1][1] && playerBox[0][1] < entityBox[1][1]) {
            collided.push([entity, Direction.South, entityBox[1][1]])
          }
          // East
          if (previousBox[0][0] > entityBox[1][0] && playerBox[0][0] < entityBox[1][0]) {
            collided.push([entity, Direction.East, entityBox[1][0]])
          }
          // West
          if (previousBox[1][0] < entityBox[0][0] && playerBox[1][0] > entityBox[0][0]) {
            collided.push([entity, Direction.West, entityBox[0][0]])
          }
        }
    }

    collided = collided.filter(collision => {
      const entity = collision[0]
      const direction = collision[1]
      const coords = tileCoords(entity.position)

      switch(direction) {
        case Direction.North: 
          return collided.find(c => equals(tileCoords(c[0].position), [coords[0], coords[1] - 1])) === undefined
        case Direction.South: 
          return collided.find(c => equals(tileCoords(c[0].position), [coords[0], coords[1] + 1])) === undefined
        case Direction.East: 
          return collided.find(c => equals(tileCoords(c[0].position), [coords[0] + 1, coords[1]])) === undefined
        case Direction.West: 
          return collided.find(c => equals(tileCoords(c[0].position), [coords[0] - 1, coords[1]])) === undefined
      }

      return true
    })

    // Halt motion for collided edges
    collided.forEach(collision => {
      const direction = collision[1]
      const value = collision[2]
      const offset = TILE_SIZE/2 + 1/1000
      switch(direction) {
        case Direction.North:
          this.position = vec2.fromValues(this.position[0], value - offset)
          break
        case Direction.South:
          this.position = vec2.fromValues(this.position[0], value + offset)
          break
        case Direction.East:
          this.position = vec2.fromValues(value + offset, this.position[1])
          break
        case Direction.West:
          this.position = vec2.fromValues(value - offset, this.position[1])
          break  
      }      
    })
  }

  render(ctx: CanvasRenderingContext2D) {
    const p = path2.translate(
      path2.rotate(PLAYER_SHAPE, this.orientation),
      this.position,
    )

    ctx.fillStyle = '#000000'
    ctx.beginPath()
    path2.applyPath(p, ctx)
    ctx.fill()
  }
}
