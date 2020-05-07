import {
  PLAYFIELD_TILE_HEIGHT,
  PLAYFIELD_TILE_WIDTH,
  TILE_SIZE,
} from './common'
import { Playfield } from './playfield'
import { Player } from './player'
import { EntityManager } from './entity'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

const width = TILE_SIZE * PLAYFIELD_TILE_WIDTH
const height = TILE_SIZE * PLAYFIELD_TILE_HEIGHT

canvas.width = width
canvas.height = height

const ctx = canvas.getContext('2d')
const manager = new EntityManager()
const playfield = new Playfield()
const player = new Player()
manager.register(player)

function gameLoop() {
  requestAnimationFrame(gameLoop)

  // Clear canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)

  // Render playfield
  playfield.render(ctx)

  // Update all entites
  manager.update()
  manager.render(ctx)
}

gameLoop()
