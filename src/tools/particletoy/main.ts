import { mat4, quat, vec3, vec4 } from 'gl-matrix'

import { Camera } from './Camera'
import { ParticleSystem } from './ParticleSystem'
// import { WebGLDebugUtils } from './webgl-debug'

import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
import { lerp } from '~/util/math'
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

const particles = new ParticleSystem('default', 30000)

for (let i = 0; i < particles.getCapacity(); i++) {
  const rotAxis = vec3.fromValues(
    lerp(-1, 1, Math.random()),
    lerp(-1, 1, Math.random()),
    lerp(-1, 1, Math.random()),
  )
  vec3.normalize(rotAxis, rotAxis)

  particles.add({
    rotation: quat.create(),
    translation: vec3.fromValues(
      lerp(-10, 10, Math.random()),
      lerp(-10, 10, Math.random()),
      lerp(-10, 10, Math.random()),
    ),
    scale: vec3.fromValues(
      lerp(0.05, 0.25, Math.random()),
      lerp(0.05, 0.25, Math.random()),
      lerp(0.05, 0.25, Math.random()),
    ),
    color: vec4.fromValues(Math.random(), Math.random(), Math.random(), 1),
    rotVel: quat.setAxisAngle(
      quat.create(),
      rotAxis,
      lerp(0.1, 0.3, Math.random()),
    ),
  })
}

particles.initRender(renderer)

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  renderer.renderUnlit(axes)

  particles.update()
  particles.render(renderer)
}

requestAnimationFrame(update)
autoReload.poll(1000)
