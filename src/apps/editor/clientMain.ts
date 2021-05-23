import { vec2 } from 'gl-matrix'

import { simulate } from '~/apps/editor/editor'
import { ClientGame } from '~/engine/client/ClientGame'
import * as autoReload from '~/web/autoReload'

declare global {
  interface Window {
    game: ClientGame
  }
}

const game = new ClientGame({
  document,
  apiLocation: location,
  viewportDimensions: vec2.fromValues(window.innerWidth, window.innerHeight),
  pixelRatio: window.devicePixelRatio,
  simulationStep: simulate,
})

window.addEventListener('resize', () => {
  game.setViewportDimensions(
    vec2.fromValues(window.innerWidth, window.innerHeight),
  )
})

function clientRenderLoop() {
  requestAnimationFrame(clientRenderLoop)
  game.update()
}

clientRenderLoop()

game.connectToServer()

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

    fetch(
      `${window.location.protocol}//${window.location.host}/api/restart`,
    ).then(() => {
      window.location.reload()
    })
  }
})

// Start auto-reload polling
autoReload.poll()

// Development-related globals
window.game = game
