import { vec2 } from 'gl-matrix'

import { Client } from '~/Client'
import * as clientHotReload from '~/clientHotReload'
import { ClientView } from '~/ClientView'
import { DebugDraw } from '~/DebugDraw'
import { GameState } from '~/Game'
import { DocumentEventKeyboard } from '~/input/DocumentEventKeyboard'
import { DocumentEventMouse } from '~/input/DocumentEventMouse'
import { IKeyboard, IMouse } from '~/input/interfaces'
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

// TODO: refactor this whole thing into a class...the way this currently works
// is gross
function makeClientObjects(): [
  Client,
  ClientView,
  IKeyboard,
  IMouse,
  DebugDraw,
] {
  const keyboard = new DocumentEventKeyboard(document)
  const mouse = new DocumentEventMouse(document)
  const debugDraw = new DebugDraw()

  const clientView = new ClientView({
    canvas3d,
    canvas2d,
    debugDraw,
  })

  const client = new Client({
    keyboard,
    mouse,
    modelLoader: clientView.getModelLoader(),
    debugDraw,
    viewportDimensions: vec2.fromValues(window.innerWidth, window.innerHeight),
  })

  return [client, clientView, keyboard, mouse, debugDraw]
}

let [clientSim, clientView, keyboard, mouse, debugDraw] = makeClientObjects()

function syncViewportSize() {
  const size = vec2.fromValues(window.innerWidth, window.innerHeight)
  canvas3d.width = canvas2d.width = size[0]
  canvas3d.height = canvas2d.height = size[1]

  clientSim.setViewportDimensions(size)
  clientView.setViewportDimensions(size)
}

window.addEventListener('resize', syncViewportSize)

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  clientSim.update()

  if (keyboard.upKeys.has('Backquote')) {
    debugDraw.setEnabled(!debugDraw.isEnabled())
  }

  // TODO: figure out a better way to prevent unloaded models from rendering.
  // Maybe: getRenderables3d() should not return renderables for models that
  // haven't been loaded yet!
  if (clientSim.state !== GameState.Connecting) {
    clientView.update({
      world2ViewTransform: clientSim.camera.getWvTransform(),
      renderables3d: clientSim.getRenderables3d(),
    })
  }

  keyboard.update()
  mouse.update()
  debugDraw.update()
}

clientRenderLoop()

// Connect to server
function connectToServer(): Promise<void> {
  const schema = location.protocol === 'https:' ? 'wss' : 'ws'
  return createServerConnectionWs(
    `${schema}://${location.host}/api/connect`,
  ).then((conn) => clientSim.connectServer(conn))
}

connectToServer()

function restartServer(): Promise<void> {
  return fetch(`${location.protocol}//${location.host}/api/restart`).then(
    () => {
      ;[clientSim, clientView, keyboard, mouse, debugDraw] = makeClientObjects()
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

// Ensure auto-reloading for dev
clientHotReload.init({ enabled: true })

// Development-related globals
window.debug = {
  client: clientSim,
  restartServer,
}
