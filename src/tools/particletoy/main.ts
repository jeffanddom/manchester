import { mat4, vec3, vec4 } from 'gl-matrix'

import { BellagioEmitter } from './BellagioEmitter'
import { Camera } from './Camera'
import { ParticleSystem } from './ParticleSystem'
// import { WebGLDebugUtils } from './webgl-debug'

import { SIMULATION_PERIOD_S } from '~/constants'
import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
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

const emitters = [
  new BellagioEmitter(particles, vec3.fromValues(-0.4, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(-0.8, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(-1.2, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(-1.6, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(0, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(0.4, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(0.8, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(1.2, 0, 0)),
  new BellagioEmitter(particles, vec3.fromValues(1.6, 0, 0)),
]

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  renderer.renderUnlit(axes)

  for (const e of emitters) {
    e.update()
  }

  particles.update(SIMULATION_PERIOD_S)
  particles.render(renderer)
}

requestAnimationFrame(update)
autoReload.poll(1000)
