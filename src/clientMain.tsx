import { vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import * as clientHotReload from '~/clientHotReload'
import { DocumentEventKeyboard } from '~/input/DocumentEventKeyboard'
import { Mouse } from '~/input/Mouse'
import { createServerConnectionWs } from '~/network/ServerConnection'

declare global {
  interface Window {
    client: Client
  }
}

// disable right clicks
document.addEventListener('contextmenu', (e) => e.preventDefault())

const canvas3d = document.createElement('canvas')
canvas3d.setAttribute(
  'style',
  'position: absolute; top: 0; left: 0; z-index: 0',
)
canvas3d.width = window.innerWidth
canvas3d.height = window.innerHeight
document.body.appendChild(canvas3d)

const canvas2d = document.createElement('canvas')
canvas2d.setAttribute(
  'style',
  'position: absolute; top: 0; left: 0; z-index: 1',
)
canvas2d.width = window.innerWidth
canvas2d.height = window.innerHeight
document.body.appendChild(canvas2d)

const client = new Client({
  canvas3d,
  canvas2d,
  keyboard: new DocumentEventKeyboard(document),
})

// Set up local input
client.mouse = new Mouse(document.body)

// Development-related globals
window.client = client // expose game to console
clientHotReload.init({ enabled: true })

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
  canvas3d.width = canvas2d.width = size[0]
  canvas3d.height = canvas2d.height = size[1]
  client.setViewportDimensions(size)
}

window.addEventListener('resize', syncViewportSize)

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  client.update()
  client.render()
}

clientRenderLoop()

// Connect to server
const schema = location.protocol === 'https:' ? 'wss' : 'ws'
createServerConnectionWs(`${schema}://${location.host}/api/connect`).then(
  (conn) => {
    client.connectServer(conn)
  },
)
