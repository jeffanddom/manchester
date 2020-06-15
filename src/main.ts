import { vec2 } from 'gl-matrix'

import * as mapData from '~/assets/maps/test.json'
import { Game } from '~/Game'
import { Map } from '~/map/interfaces'
import * as time from '~/util/time'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const game = new Game(canvas, Map.fromRaw(mapData))
let prevFrameTime = time.current()

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
  console.log(size)

  canvas.width = size[0]
  canvas.height = size[1]
  game.setViewportDimensions(size)
}

window.addEventListener('resize', syncViewportSize)

function gameLoop() {
  requestAnimationFrame(gameLoop)

  const now = time.current()
  const dt = now - prevFrameTime
  prevFrameTime = now

  game.update(dt)
  game.render()
}

gameLoop()
