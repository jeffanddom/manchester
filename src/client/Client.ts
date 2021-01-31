import { vec2 } from 'gl-matrix'

import { ClientRenderManager } from '~/client/ClientRenderManager'
import { ClientSim } from '~/client/ClientSim'
import { DebugDraw } from '~/DebugDraw'
import { GameState } from '~/Game'
import { DocumentEventKeyboard } from '~/input/DocumentEventKeyboard'
import { DocumentEventMouse } from '~/input/DocumentEventMouse'
import { IKeyboard, IMouse } from '~/input/interfaces'
import { createServerConnectionWs } from '~/network/ServerConnection'
import { Immutable } from '~/types/immutable'

export class Client {
  document: Document
  location: Location
  viewportDimensions: vec2
  canvas3d: HTMLCanvasElement
  canvas2d: HTMLCanvasElement

  // The following objects should get re-constructed on server restart
  keyboard: IKeyboard
  mouse: IMouse
  debugDraw: DebugDraw
  renderManager: ClientRenderManager
  sim: ClientSim

  constructor(params: {
    document: Document
    location: Location
    viewportDimensions: Immutable<vec2>
  }) {
    this.document = params.document
    this.location = params.location
    this.viewportDimensions = vec2.clone(params.viewportDimensions)

    // disable right clicks
    this.document.addEventListener('contextmenu', (e) => e.preventDefault())

    this.canvas3d = this.document.createElement('canvas')
    this.canvas3d.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; z-index: 0',
    )
    this.canvas3d.width = this.viewportDimensions[0] * 2
    this.canvas3d.height = this.viewportDimensions[1] * 2
    this.document.body.appendChild(this.canvas3d)

    this.canvas2d = document.createElement('canvas')
    this.canvas2d.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; z-index: 1',
    )
    this.canvas2d.width = this.viewportDimensions[0]
    this.canvas2d.height = this.viewportDimensions[1]
    this.document.body.appendChild(this.canvas2d)

    this.keyboard = new DocumentEventKeyboard(this.document)
    this.mouse = new DocumentEventMouse(this.document)
    this.debugDraw = new DebugDraw()

    this.renderManager = new ClientRenderManager({
      canvas3d: this.canvas3d,
      canvas2d: this.canvas2d,
      debugDraw: this.debugDraw,
    })

    this.sim = new ClientSim({
      keyboard: this.keyboard,
      mouse: this.mouse,
      modelLoader: this.renderManager.getModelLoader(),
      debugDraw: this.debugDraw,
      viewportDimensions: this.viewportDimensions,
    })
  }

  update(): void {
    this.sim.update()

    if (this.keyboard.upKeys.has('Backquote')) {
      this.debugDraw.setEnabled(!this.debugDraw.isEnabled())
    }

    if (this.sim.state !== GameState.Connecting) {
      this.renderManager.update(
        this.sim.getRenderables(),
        this.sim.camera.getWvTransform(),
      )
    }

    this.keyboard.update()
    this.mouse.update()
    this.debugDraw.update()
  }

  syncViewportDimensions(d: Immutable<vec2>): void {
    vec2.copy(this.viewportDimensions, d)
    this.canvas3d.width = this.viewportDimensions[0]
    this.canvas3d.height = this.viewportDimensions[1]
    this.canvas2d.width = this.viewportDimensions[0]
    this.canvas2d.height = this.viewportDimensions[1]

    this.sim.setViewportDimensions(this.viewportDimensions)
    this.renderManager.setViewportDimensions(this.viewportDimensions)
  }

  connectToServer(): Promise<void> {
    const schema = this.location.protocol === 'https:' ? 'wss' : 'ws'
    return createServerConnectionWs(
      `${schema}://${this.location.host}/api/connect`,
    ).then((conn) => this.sim.connectServer(conn))
  }

  restartServer(): Promise<void> {
    return fetch(
      `${this.location.protocol}//${this.location.host}/api/restart`,
    ).then(() => {
      this.keyboard = new DocumentEventKeyboard(this.document)
      this.mouse = new DocumentEventMouse(this.document)
      this.debugDraw = new DebugDraw()

      this.renderManager = new ClientRenderManager({
        canvas3d: this.canvas3d,
        canvas2d: this.canvas2d,
        debugDraw: this.debugDraw,
      })

      this.sim = new ClientSim({
        keyboard: this.keyboard,
        mouse: this.mouse,
        modelLoader: this.renderManager.getModelLoader(),
        debugDraw: this.debugDraw,
        viewportDimensions: this.viewportDimensions,
      })

      return this.connectToServer()
    })
  }
}
