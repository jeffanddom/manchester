import { vec2 } from 'gl-matrix'

import { Client } from '~/client/Client'
import * as autoReload from '~/web/autoReload'

declare global {
  interface Window {
    client: Client
  }
}

const client = new Client({
  document,
  location,
  viewportDimensions: vec2.fromValues(window.innerWidth, window.innerHeight),
  pixelRatio: window.devicePixelRatio,
})

window.addEventListener('resize', () => {
  client.setViewportDimensions(
    vec2.fromValues(window.innerWidth, window.innerHeight),
  )
})

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  client.update()
}

clientRenderLoop()

client.connectToServer()

// Add a debounced hotkey for restarting the server
let restartHotkeyTimeout: number | undefined = undefined
document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyR' && event.ctrlKey && event.shiftKey) {
    if (restartHotkeyTimeout !== undefined) {
      return
    }

    restartHotkeyTimeout = window.setTimeout(() => {
      restartHotkeyTimeout = undefined
    }, 500)

    client.restartServer()
  }
})

// Start auto-reload polling
autoReload.poll()

// Development-related globals
window.client = client
