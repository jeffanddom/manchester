import { mat4, vec2 } from 'gl-matrix'

import { ClientRenderManager } from '~/client/ClientRenderManager'
import { ClientSim } from '~/client/ClientSim'
import { SIMULATION_PERIOD_S } from '~/constants'
import { DebugDraw } from '~/DebugDraw'
import { GameState } from '~/Game'
import { BrowserKeyboard } from '~/input/BrowserKeyboard'
import { BrowserMouse } from '~/input/BrowserMouse'
import { IKeyboard, IMouse } from '~/input/interfaces'
import { createServerConnectionWs } from '~/network/ServerConnection'
import { ParticleSystem } from '~/particles/ParticleSystem'
import { Immutable } from '~/types/immutable'

export class Client {
  location: Location
  viewportDimensions: vec2
  pixelRatio: number

  canvas3d: HTMLCanvasElement
  canvas2d: HTMLCanvasElement
  gl: WebGL2RenderingContext
  ctx2d: CanvasRenderingContext2D

  // The following objects should get re-constructed on server restart
  keyboard: IKeyboard
  mouse: IMouse
  debugDraw: DebugDraw
  renderManager: ClientRenderManager
  sim: ClientSim
  particleSystem: ParticleSystem

  constructor(params: {
    document: Document
    location: Location
    viewportDimensions: Immutable<vec2>
    pixelRatio: number
  }) {
    this.location = params.location
    this.viewportDimensions = vec2.clone(params.viewportDimensions)
    this.pixelRatio = params.pixelRatio

    // disable right clicks
    params.document.addEventListener('contextmenu', (e) => e.preventDefault())

    this.canvas3d = params.document.createElement('canvas')
    this.canvas3d.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; z-index: 0',
    )
    this.canvas3d.width = this.viewportDimensions[0] * this.pixelRatio
    this.canvas3d.height = this.viewportDimensions[1] * this.pixelRatio
    params.document.body.appendChild(this.canvas3d)

    this.canvas2d = document.createElement('canvas')
    this.canvas2d.setAttribute(
      'style',
      'position: absolute; top: 0; left: 0; z-index: 1',
    )
    this.canvas2d.width = this.viewportDimensions[0]
    this.canvas2d.height = this.viewportDimensions[1]
    params.document.body.appendChild(this.canvas2d)

    this.keyboard = new BrowserKeyboard(params.document)
    this.mouse = new BrowserMouse(params.document)
    this.debugDraw = new DebugDraw()
    this.particleSystem = new ParticleSystem('particle', 10000)

    const gl = this.canvas3d.getContext('webgl2')
    if (gl === null) {
      throw `WebGL2 not available in canvas`
    }
    this.gl = gl

    const ctx2d = this.canvas2d.getContext('2d')
    if (ctx2d === null) {
      throw `2D rendering context not available in canvas`
    }
    this.ctx2d = ctx2d

    this.renderManager = new ClientRenderManager({
      gl: this.gl,
      ctx2d: this.ctx2d,
      debugDraw: this.debugDraw,
    })

    this.particleSystem.initRender(this.renderManager.renderer3d)

    this.sim = new ClientSim({
      keyboard: this.keyboard,
      mouse: this.mouse,
      modelLoader: this.renderManager.getModelLoader(),
      debugDraw: this.debugDraw,
      viewportDimensions: this.viewportDimensions,
      addEmitter: (emitter) => this.particleSystem.addEmitter(emitter),
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
        this.sim.camera.getWvTransform(mat4.create()),
      )
      this.particleSystem.update(SIMULATION_PERIOD_S)
      this.particleSystem.render(this.renderManager.renderer3d)
    }

    this.keyboard.update()
    this.mouse.update()
    this.debugDraw.update()
  }

  setViewportDimensions(d: Immutable<vec2>): void {
    vec2.copy(this.viewportDimensions, d)

    this.canvas3d.width = this.viewportDimensions[0] * this.pixelRatio
    this.canvas3d.height = this.viewportDimensions[1] * this.pixelRatio
    this.canvas2d.width = this.viewportDimensions[0]
    this.canvas2d.height = this.viewportDimensions[1]

    this.sim.setViewportDimensions(this.viewportDimensions)
    this.renderManager.syncViewportDimensions()
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
      this.keyboard.reset()
      this.mouse.reset()
      this.debugDraw = new DebugDraw()

      this.renderManager = new ClientRenderManager({
        gl: this.gl,
        ctx2d: this.ctx2d,
        debugDraw: this.debugDraw,
      })

      this.sim = new ClientSim({
        keyboard: this.keyboard,
        mouse: this.mouse,
        modelLoader: this.renderManager.getModelLoader(),
        debugDraw: this.debugDraw,
        viewportDimensions: this.viewportDimensions,
        addEmitter: (emitter) => this.particleSystem.addEmitter(emitter),
      })

      return this.connectToServer()
    })
  }
}
