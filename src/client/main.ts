import { vec2 } from 'gl-matrix'

import * as autoReload from '~/client/autoReload'
import { Client } from '~/client/Client'

declare global {
  interface Window {
    client: Client
  }
}

const client = new Client({
  document,
  location,
  viewportDimensions: vec2.fromValues(window.innerWidth, window.innerHeight),
})

window.addEventListener('resize', () => {
  client.syncViewportDimensions(
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

// Ensure auto-reloading for dev
autoReload.init({ enabled: true })

// Development-related globals
window.client = client
