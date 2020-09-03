import { vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import { SIMULATION_PERIOD_S } from '~/constants'
import { GameState } from '~/Game'
import { Keyboard } from '~/Keyboard'
import { Mouse } from '~/Mouse'
import { Server } from '~/Server'

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

const server = new Server()
const client = new Client(canvas)
const simulatedClient = new Client(document.createElement('canvas'))

client.connect(server)
simulatedClient.connect(server)

// Set up local input
client.keyboard = new Keyboard()
client.mouse = new Mouse(canvas)

window.g = window.game = client // expose game to console

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

let clientFrame = 1
function clientSimulationLoop() {
  setInterval(() => {
    client.update(SIMULATION_PERIOD_S, clientFrame)
    clientFrame++
  }, 1000 * SIMULATION_PERIOD_S)
}

let simulatedClientFrame = 1
function simulatedClientSimulationLoop() {
  setInterval(() => {
    simulatedClient.update(SIMULATION_PERIOD_S, simulatedClientFrame)
    simulatedClientFrame++
  }, 1000 * SIMULATION_PERIOD_S)
}

// Server update
let serverFrame = 0
const serverLoop = () => {
  setInterval(() => {
    server.update(SIMULATION_PERIOD_S, serverFrame)
    serverFrame++
  }, 1000 * SIMULATION_PERIOD_S)
}

server.setState(GameState.Running)
serverLoop()
clientSimulationLoop()
simulatedClientSimulationLoop() // lol
clientRenderLoop()
