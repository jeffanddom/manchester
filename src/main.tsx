import { vec2 } from 'gl-matrix'

import * as clientHotReload from './build/clientHotReload'
import { createServerConnectionWs } from './network/ServerConnection'

import { Client } from '~/Client'
import { SIMULATION_PERIOD_S } from '~/constants'
import { Keyboard } from '~/Keyboard'
import { Mouse } from '~/Mouse'

declare global {
  interface Window {
    g: Client
    game: Client
  }
}

// disable right clicks
document.addEventListener('contextmenu', (e) => e.preventDefault())

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const client = new Client(canvas)

// Set up local input
client.keyboard = new Keyboard()
client.mouse = new Mouse(canvas)

// Development-related globals
window.g = window.game = client // expose game to console
clientHotReload.init()

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
  canvas.width = size[0]
  canvas.height = size[1]
  client.setViewportDimensions(size)
}

window.addEventListener('resize', syncViewportSize)

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  client.render()
}

let clientFrame = 0
function clientSimulationLoop() {
  setInterval(() => {
    client.update(SIMULATION_PERIOD_S, clientFrame)
    clientFrame++
  }, 1000 * SIMULATION_PERIOD_S)
}

clientSimulationLoop()
clientRenderLoop()

// Connect to server
createServerConnectionWs(`ws://${location.host}/api/connect`).then((conn) => {
  client.connectServer(conn)
})
