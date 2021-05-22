import { mat4, quat, vec4 } from 'gl-matrix'
import React from 'react'
import ReactDOM from 'react-dom'

import { Camera } from './Camera'
import { Controls } from './Controls'

import {
  BasicEmitter,
  BasicEmitterSettings,
} from '~/engine/particles/emitters/BasicEmitter'
import { ParticleSystem } from '~/engine/particles/ParticleSystem'
import {
  Renderer3d,
  UnlitObject,
  UnlitObjectType,
} from '~/engine/renderer/Renderer3d'
import { CAMERA_DEFAULT_FOV, SIMULATION_PERIOD_S } from '~/game/constants'
import { Immutable } from '~/types/immutable'
import { Zero3 } from '~/util/math'
import * as autoReload from '~/web/autoReload'

const LOOP_GAP = 1.5

class EmitterManager {
  private particleSystem: ParticleSystem
  private slots: {
    settings: Immutable<BasicEmitterSettings>
    emitter: BasicEmitter
  }[]
  private orientation: quat
  private loopGapTimer: number

  public constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem
    this.slots = []
    this.orientation = quat.create()
    this.loopGapTimer = 0
  }

  public add(settings: Immutable<BasicEmitterSettings>): void {
    const emitter = new BasicEmitter(Zero3, this.orientation, settings)
    this.slots.push({ settings, emitter })
    this.particleSystem.addEmitter(emitter)
  }

  public remove(index: number): void {
    this.slots[index].emitter.deactivate()
    this.slots.splice(index, 1)
  }

  public setOrientation(orientation: Immutable<quat>): void {
    quat.copy(this.orientation, orientation)
    for (const { emitter } of this.slots) {
      emitter.setOrientation(this.orientation)
    }
  }

  public update(dt: number): void {
    if (this.particleSystem.numActiveEmitters() > 0) {
      return
    }

    if (this.loopGapTimer < LOOP_GAP) {
      this.loopGapTimer += dt
      return
    }

    this.loopGapTimer = 0

    // None of the emitters are currently active. Now that we've waited
    // LOOP_GAP seconds, reactivate the emitters so they play in a loop.
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i].emitter = new BasicEmitter(
        Zero3,
        this.orientation,
        this.slots[i].settings,
      )

      this.particleSystem.addEmitter(this.slots[i].emitter)
    }
  }
}

const canvas = document.getElementById('renderer') as HTMLCanvasElement
const gl = canvas.getContext('webgl2')!

const pixelRatio = window.devicePixelRatio
canvas.width = canvas.parentElement!.clientWidth * pixelRatio
canvas.height = canvas.parentElement!.clientHeight * pixelRatio

const renderer = new Renderer3d(gl)
renderer.setFov(CAMERA_DEFAULT_FOV)

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement!.clientWidth * pixelRatio
  canvas.height = canvas.parentElement!.clientHeight * pixelRatio
  renderer.syncViewportDimensions()
})

const camera = new Camera(canvas)

const axes: UnlitObject[] = []
for (let axis = 0; axis < 3; axis++) {
  const pos = new Float32Array([0, 0, 0, 0, 0, 0])
  const color = vec4.fromValues(0, 0, 0, 1)

  // positive axis
  pos[3 + axis] = 1000
  color[axis] = 0.75
  axes.push({
    type: UnlitObjectType.Lines,
    positions: pos.slice(),
    color: vec4.clone(color),
  })

  // negative axis
  pos[3 + axis] *= -1
  color[3] = 0.4
  axes.push({
    type: UnlitObjectType.Lines,
    positions: pos.slice(),
    color: vec4.clone(color),
  })
}

const particleSystem = new ParticleSystem('default', 100 * 1000)
const emitterManager = new EmitterManager(particleSystem)

particleSystem.initRender(renderer)

function update(): void {
  requestAnimationFrame(update)

  emitterManager.update(SIMULATION_PERIOD_S)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  renderer.renderUnlit(axes)

  particleSystem.update(SIMULATION_PERIOD_S)
  particleSystem.render(renderer)
}

requestAnimationFrame(update)
autoReload.poll(1000)

ReactDOM.render(
  React.createElement(Controls, {
    createEmitter: (settings: Immutable<BasicEmitterSettings>) =>
      emitterManager.add(settings),
    removeEmitter: (index: number) => emitterManager.remove(index),
    setOrientation: (orientation: Immutable<quat>) =>
      emitterManager.setOrientation(orientation),
  }),
  document.getElementById('controls'),
)
