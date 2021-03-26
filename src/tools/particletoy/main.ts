import { mat4, quat, vec3, vec4 } from 'gl-matrix'

import { Camera } from './Camera'
import { ParticleSystem } from './ParticleSystem'
// import { WebGLDebugUtils } from './webgl-debug'

import { SIMULATION_PERIOD_S } from '~/constants'
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

class Emitter {
  private system: ParticleSystem
  private potentialParticles: number
  private origin: vec3

  constructor(system: ParticleSystem, origin: vec3) {
    this.system = system
    this.potentialParticles = 0
    this.origin = vec3.clone(origin)
  }

  public update(): void {
    this.potentialParticles += 1000 * SIMULATION_PERIOD_S
    while (this.potentialParticles >= 1) {
      this.potentialParticles -= 1

      const rotAxis = vec3.fromValues(
        lerp(-1, 1, Math.random()),
        lerp(-1, 1, Math.random()),
        lerp(-1, 1, Math.random()),
      )
      vec3.normalize(rotAxis, rotAxis)

      this.system.add({
        ttl: 3,
        rotation: quat.create(),
        translation: vec3.add(
          vec3.create(),
          vec3.fromValues(
            lerp(-0.05, 0.05, Math.random()),
            lerp(-0.05, 0.05, Math.random()),
            lerp(-0.05, 0.05, Math.random()),
          ),
          this.origin,
        ),
        scale: vec3.fromValues(
          lerp(0.05, 0.25, Math.random()),
          lerp(0.05, 0.25, Math.random()),
          lerp(0.05, 0.25, Math.random()),
        ),
        color: vec4.fromValues(
          lerp(0, 0.1, Math.random()),
          lerp(0.4, 0.7, Math.random()),
          lerp(0.6, 1, Math.random()),
          1,
        ),
        vel: vec3.fromValues(
          lerp(-1, 1, Math.random()),
          lerp(1, 5, Math.random()),
          lerp(-1, 1, Math.random()),
        ),
        accel: vec3.fromValues(0, -1.5, 0),
        rotVel: quat.setAxisAngle(
          quat.create(),
          rotAxis,
          lerp(0.1, 0.3, Math.random()),
        ),
      })
    }
  }
}

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
  new Emitter(particles, vec3.fromValues(-3, 0, 0)),
  new Emitter(particles, vec3.fromValues(0, 0, 0)),
  new Emitter(particles, vec3.fromValues(3, 0, 0)),
  new Emitter(particles, vec3.fromValues(0, 0, -3)),
  new Emitter(particles, vec3.fromValues(0, 0, 3)),
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
