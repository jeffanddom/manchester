import { VIEWPORT_TILE_DIMENSIONS, TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { vec2 } from 'gl-matrix'
import * as time from '~util/time'
import * as mapData from '~/assets/maps/test.json'
import { Map } from '~map/interfaces'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

const viewportDimensions = vec2.scale(
  vec2.create(),
  VIEWPORT_TILE_DIMENSIONS,
  TILE_SIZE,
)

canvas.width = viewportDimensions[0]
canvas.height = viewportDimensions[1]

const game = new Game(canvas, Map.fromRaw(mapData), viewportDimensions)
let prevFrameTime = time.current()

function gameLoop() {
  requestAnimationFrame(gameLoop)

  const now = time.current()
  const dt = now - prevFrameTime
  prevFrameTime = now

  game.update(dt)
  game.render()
}

gameLoop()
