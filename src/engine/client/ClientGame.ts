import { mat4, vec2 } from 'gl-matrix'

import { ClientRenderManager } from '~/engine/client/ClientRenderManager'
import { DebugDraw } from '~/engine/DebugDraw'
import { BrowserKeyboard } from '~/engine/input/BrowserKeyboard'
import { BrowserMouse } from '~/engine/input/BrowserMouse'
import { IKeyboard, IMouse } from '~/engine/input/interfaces'
import { createServerConnectionWs } from '~/engine/network/ServerConnection'
import { ParticleConfig } from '~/engine/particles/interfaces'
import { ParticleSystem } from '~/engine/particles/ParticleSystem'
import { ClientSim } from '~/game/ClientSim'
import { Immutable } from '~/types/immutable'

export class ClientGame {
  apiLocation: {
    host: string
    protocol: string
  }
  viewportDimensions: vec2
  pixelRatio: number
  simulationPeriod: number

  canvas3d: HTMLCanvasElement
  canvas2d: HTMLCanvasElement
  gl: WebGL2RenderingContext
  ctx2d: CanvasRenderingContext2D

  keyboard: IKeyboard
  mouse: IMouse
  debugDraw: DebugDraw
  renderManager: ClientRenderManager
  sim: ClientSim
  particleSystem: ParticleSystem

  constructor(params: {
    document: Document
    apiLocation: {
      host: string
      protocol: string
    }
    viewportDimensions: Immutable<vec2>
    pixelRatio: number
    simulationPeriod: number
  }) {
    this.apiLocation = params.apiLocation
    this.viewportDimensions = vec2.clone(params.viewportDimensions)
    this.pixelRatio = params.pixelRatio
    this.simulationPeriod = params.simulationPeriod

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

    // TODO: what's wrong with rendering all the time
    if (this.sim.getAllClientsReady()) {
      this.renderManager.update(
        this.sim.getRenderables(),
        this.sim.camera.getWvTransform(mat4.create()),
        this.sim.camera.getFov(),
        this.sim.getRenderables2d(),
      )

      // Collect new particles from emitter components
      this.sim.emitParticles((config: Immutable<ParticleConfig>) => {
        this.particleSystem.add(config)
      })

      // Simulate particles
      this.particleSystem.update(this.simulationPeriod)
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
    const schema = this.apiLocation.protocol === 'https:' ? 'wss' : 'ws'
    return createServerConnectionWs(
      `${schema}://${this.apiLocation.host}/api/connect`,
    ).then((conn) => this.sim.connectServer(conn))
  }
}
