import { vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import * as clientHotReload from '~/clientHotReload'
import { DocumentEventKeyboard } from '~/input/DocumentEventKeyboard'
import { DocumentEventMouse } from '~/input/Mouse'
import { createServerConnectionWs } from '~/network/ServerConnection'

declare global {
  interface Window {
    debug: {
      client: Client
      restartServer: () => Promise<void>
    }
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

let client = new Client({
  canvas3d,
  canvas2d,
  keyboard: new DocumentEventKeyboard(document),
  mouse: new DocumentEventMouse(document),
})

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
function connectToServer(): Promise<void> {
  const schema = location.protocol === 'https:' ? 'wss' : 'ws'
  return createServerConnectionWs(
    `${schema}://${location.host}/api/connect`,
  ).then((conn) => client.connectServer(conn))
}

connectToServer()

function restartServer(): Promise<void> {
  return fetch(`${location.protocol}//${location.host}/api/restart`).then(
    () => {
      client = new Client({
        canvas3d,
        canvas2d,
        keyboard: new DocumentEventKeyboard(document),
        mouse: new DocumentEventMouse(document),
      })
      return connectToServer()
    },
  )
}

// Add a debounced hotkey for restarting the server
let restartHotkeyTimeout: number | undefined = undefined
document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyR' && event.ctrlKey && event.shiftKey) {
    if (restartHotkeyTimeout !== undefined) {
      return
    }

    restartHotkeyTimeout = setTimeout(() => {
      restartHotkeyTimeout = undefined
    }, 500)
    restartServer()
  }
})

// Development-related globals
window.debug = {
  client,
  restartServer,
}
