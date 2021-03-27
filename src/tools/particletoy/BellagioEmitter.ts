import { quat, vec3, vec4 } from 'gl-matrix'

import { SIMULATION_PERIOD_S } from '~/constants'
import { ParticleConfig, ParticleEmitter } from '~/particles/interfaces'
import { lerp } from '~/util/math'

export class BellagioEmitter implements ParticleEmitter {
  private potentialParticles: number
  private direction: number
  private origin: vec3

  constructor(origin: vec3) {
    this.potentialParticles = 0
    this.direction = 0
    this.origin = vec3.clone(origin)
  }

  public isActive(): boolean {
    return true
  }

  public update(
    _dt: number,
    addParticle: (config: ParticleConfig) => void,
  ): void {
    this.potentialParticles += 1000 * SIMULATION_PERIOD_S
    this.direction += SIMULATION_PERIOD_S * 2
    while (this.potentialParticles >= 1) {
      this.potentialParticles -= 1

      const rotAxis = vec3.fromValues(
        lerp(-1, 1, Math.random()),
        lerp(-1, 1, Math.random()),
        lerp(-1, 1, Math.random()),
      )
      vec3.normalize(rotAxis, rotAxis)

      addParticle({
        ttl: 1.5,
        rotation: quat.create(),
        translation: vec3.add(
          vec3.create(),
          vec3.fromValues(
            lerp(-0.01, 0.02, Math.random()),
            lerp(-0.01, 0.02, Math.random()),
            lerp(-0.01, 0.02, Math.random()),
          ),
          this.origin,
        ),
        scale: vec3.fromValues(
          lerp(0.03, 0.04, Math.random()),
          lerp(0.03, 0.04, Math.random()),
          lerp(0.03, 0.04, Math.random()),
        ),
        color: vec4.fromValues(
          lerp(0, 0.1, Math.random()),
          lerp(0.4, 0.7, Math.random()),
          lerp(0.6, 1, Math.random()),
          1,
        ),
        vel: vec3.rotateZ(
          vec3.create(),
          vec3.fromValues(
            lerp(-0.1, 0.1, Math.random()),
            lerp(2.5, 3, Math.random()),
            lerp(-0.1, 0.1, Math.random()),
          ),
          vec3.create(),
          lerp(0, 0.5, Math.sin(this.direction)),
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
