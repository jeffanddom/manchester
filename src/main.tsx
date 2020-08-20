import { vec2 } from 'gl-matrix'
// import * as React from 'react'
// import * as ReactDOM from 'react-dom'

import { render } from 'react-dom'

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

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
  canvas.width = size[0]
  canvas.height = size[1]
  game.setViewportDimensions(size)
}

window.addEventListener('resize', syncViewportSize)

let renderPrevFrame = time.current()
function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)

  const now = time.current()
  const dt = now - renderPrevFrame
  renderPrevFrame = now

  game.clientUpdate(dt)
  game.serverUpdate(dt)
  game.render()
}

let clientPrevFrameTime = time.current()
function clientSimulationLoop() {
  setTimeout(clientSimulationLoop, 1000.0 / 60)

  const now = time.current()
  const dt = now - clientPrevFrameTime
  clientPrevFrameTime = now

  game.clientUpdate(dt)
  game.serverUpdate(dt)
}

// Server update
let serverPrevFrameTime = time.current()
const serverLoop = () => {
  const now = time.current()
  const dt = now - serverPrevFrameTime
  serverPrevFrameTime = now

  game.serverUpdate(dt)
  setTimeout(serverLoop, 1000.0 / 10)
}

// serverLoop()
// clientSimulationLoop()

clientRenderLoop()
