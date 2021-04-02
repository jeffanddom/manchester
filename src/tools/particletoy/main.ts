import { mat4, vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'
import { quat } from 'gl-matrix'
import React from 'react'
import ReactDOM from 'react-dom'

import { Camera } from './Camera'
import { Controls } from './Controls'

import { SIMULATION_PERIOD_S } from '~/constants'
import {
  BasicEmitter,
  BasicEmitterSettings,
} from '~/particles/emitters/BasicEmitter'
import { ParticleSystem } from '~/particles/ParticleSystem'
import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
import { Immutable } from '~/types/immutable'
import * as autoReload from '~/web/autoReload'

const canvas = document.getElementById('renderer') as HTMLCanvasElement
const gl = canvas.getContext('webgl2')!

const pixelRatio = window.devicePixelRatio
canvas.width = canvas.parentElement!.clientWidth * pixelRatio
canvas.height = canvas.parentElement!.clientHeight * pixelRatio

const renderer = new Renderer3d(gl)

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

const particles = new ParticleSystem('default', 100 * 1000)

particles.initRender(renderer)

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  renderer.renderUnlit(axes)

  particles.update(SIMULATION_PERIOD_S)
  particles.render(renderer)
}

requestAnimationFrame(update)
autoReload.poll(1000)

const createEmitter = (
  origin: Immutable<vec3>,
  orientation: Immutable<quat>,
  config: BasicEmitterSettings,
) => {
  const emitter = new BasicEmitter(origin, orientation, config)
  particles.addEmitter(emitter)
  return emitter
}

ReactDOM.render(
  React.createElement(Controls, { createEmitter }),
  document.getElementById('controls'),
)
