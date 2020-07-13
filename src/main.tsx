import { vec2 } from 'gl-matrix'
// import * as React from 'react'
// import * as ReactDOM from 'react-dom'

import { Game, GameState } from '~/Game'
// import { Controls } from '~/ui/Controls'
import * as time from '~/util/time'

declare global {
  interface Window {
    g: Game
    game: Game
  }
}

// disable right clicks
document.addEventListener('contextmenu', (e) => e.preventDefault())

// const htmlNode = document.getElementById('controls')
// ReactDOM.render(<Controls />, htmlNode)

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const game = new Game(canvas)
game.setState(GameState.Running)
window.g = window.game = game // expose game to console

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
