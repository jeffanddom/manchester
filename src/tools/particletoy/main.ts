import { mat4, quat, vec3, vec4 } from 'gl-matrix'
import React from 'react'
import ReactDOM from 'react-dom'

import { Camera } from './Camera'
import { Controls } from './Controls'
// import { WebGLDebugUtils } from './webgl-debug'

import { SIMULATION_PERIOD_S } from '~/constants'
import { BasicEmitter } from '~/particles/emitters/BasicEmitter'
import { ParticleSystem } from '~/particles/ParticleSystem'
import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
import { One4 } from '~/util/math'
import * as autoReload from '~/web/autoReload'

// function logGLCall(functionName: string, args: unknown): void {
//   console.log(
//     'gl.' +
//       functionName +
//       '(' +
//       WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
//       ')',
//   )
// }

const canvas = document.getElementById('renderer') as HTMLCanvasElement

const gl = canvas.getContext('webgl2')!
// const gl = WebGLDebugUtils.makeDebugContext(
//   canvas.getContext('webgl2')!,
//   undefined,
//   logGLCall,
// )

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

const emitter = new BasicEmitter({
  emitterTtl: undefined, // nonexpiring
  origin: vec3.create(),
  orientation: quat.fromEuler(quat.create(), -90, 0, 45),
  spawnRate: 40,
  particleTtlRange: [2, 3],
  orientationOffsetRange: [quat.create(), quat.create()],
  translationOffsetRange: [
    vec3.fromValues(-0.1, -0.1, -0.1),
    vec3.fromValues(0.1, 0.1, 0.1),
  ],
  scaleRange: [vec3.fromValues(0.1, 0.1, 0.1), vec3.fromValues(0.1, 0.1, 0.1)],
  colorRange: [vec4.create(), vec4.clone(One4)],
  velRange: [vec3.fromValues(-0.5, -0.5, 2), vec3.fromValues(0.5, 0.5, 4.5)],
  rotVelRange: [
    quat.fromEuler(quat.create(), 5, 0, 0),
    quat.fromEuler(quat.create(), 15, 0, 0),
  ],
  gravity: vec3.fromValues(0, -5, 0),
})

particles.addEmitter(emitter)

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

ReactDOM.render(
  React.createElement(Controls, { emitter }),
  document.getElementById('controls'),
)
