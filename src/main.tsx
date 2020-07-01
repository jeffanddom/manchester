import { vec2 } from 'gl-matrix'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { maps } from '~/assets/maps'
import { Game } from '~/Game'
import { Map } from '~/map/interfaces'
import { getCurrentMap } from '~/storage'
import { Controls } from '~/ui/Controls'
import * as time from '~/util/time'

const htmlNode = document.getElementById('controls')
ReactDOM.render(<Controls />, htmlNode)

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const map = maps[getCurrentMap() || 'bigMap']
const game = new Game(canvas, Map.fromRaw(map))
let prevFrameTime = time.current()

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
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
