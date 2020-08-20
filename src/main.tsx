import { vec2 } from 'gl-matrix'

import { Game, GameState } from '~/Game'
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

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  game.render()
}

let clientFrame = 5
let clientPrevFrameTime = time.current()
function clientSimulationLoop() {
  setTimeout(clientSimulationLoop, 1000.0 / 60)

  const now = time.current()
  const dt = now - clientPrevFrameTime
  clientPrevFrameTime = now

  game.clientUpdate(dt, clientFrame)
  clientFrame++
}

// Server update
let serverFrame = 0
let serverPrevFrameTime = time.current()
const serverLoop = () => {
  setTimeout(serverLoop, 1000.0 / 60)

  const now = time.current()
  const dt = now - serverPrevFrameTime
  serverPrevFrameTime = now

  game.serverUpdate(dt, serverFrame)
  serverFrame++
}

serverLoop()
clientSimulationLoop()
clientRenderLoop()
