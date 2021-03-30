import { quat, vec3, vec4 } from 'gl-matrix'

import { ParticleConfig, ParticleEmitter } from '~/particles/interfaces'
import { lerp, multilerp3, multilerp4 } from '~/util/math'

export interface BasicEmitterConfig {
  emitterTtl: number | undefined // undefined = nonexpiring
  origin: vec3
  orientation: quat
  spawnRate: number

  particleTtlRange: [number, number]

  // initial attribs
  orientationOffsetRange: [quat, quat] // will be transformed by orientation
  translationOffsetRange: [vec3, vec3] // will be transformed by origin & orientation
  scaleRange: [vec3, vec3] // will NOT be transformed by orientation
  colorRange: [vec4, vec4]

  // physics
  velRange: [vec3, vec3] // will be transformed by orientation
  gravity: vec3 // a constant global acceleration, will NOT be transformed by orientation
  rotVelRange: [quat, quat] // will be transformed by orientation
}

export class BasicEmitter implements ParticleEmitter {
  private config: BasicEmitterConfig

  private ttl: number | undefined // ttl remaining, not initial TTL. An undefined TTL means the emitter will not expire.
  private potentialParticles: number

  // temporaries
  private tempQuat: [quat, quat]
  private tempVec3: [vec3, vec3, vec3]
  private tempVec4: [vec4]

  /**
   * The caller should assume that the emitter will take ownership of the
   * objects inside config. Don't pass in objects or arrays that are used in
   * the calling context _after_ the constructor is called.
   */
  constructor(config: BasicEmitterConfig) {
    this.config = config
    this.ttl = config.emitterTtl
    this.potentialParticles = 0

    this.tempQuat = [quat.create(), quat.create()]
    this.tempVec3 = [vec3.create(), vec3.create(), vec3.create()]
    this.tempVec4 = [vec4.create()]
  }

  /**
   * Retrieve a modifiable reference to the emitter's internal configuration.
   */
  public getMutableConfig(): BasicEmitterConfig {
    return this.config
  }

  public update(dt: number, add: (config: ParticleConfig) => void): void {
    if (this.ttl !== undefined) {
      if (this.ttl <= 0) {
        return
      }

      this.ttl -= dt
    }

    this.potentialParticles += this.config.spawnRate * dt

    const [orientation, rotVel] = this.tempQuat
    const [translation, scale, vel] = this.tempVec3
    const [color] = this.tempVec4

    while (this.potentialParticles >= 1) {
      this.potentialParticles -= 1

      const ttl = lerp(
        this.config.particleTtlRange[0],
        this.config.particleTtlRange[1],
        Math.random(),
      )

      quat.slerp(
        orientation,
        this.config.orientationOffsetRange[0],
        this.config.orientationOffsetRange[1],
        Math.random(),
      )
      quat.multiply(orientation, this.config.orientation, orientation) // offset should apply before global orientation

      multilerp3(
        translation,
        this.config.translationOffsetRange[0],
        this.config.translationOffsetRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
      )
      vec3.transformQuat(translation, translation, this.config.orientation)
      vec3.add(translation, translation, this.config.origin)

      multilerp3(
        scale,
        this.config.scaleRange[0],
        this.config.scaleRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
      )

      multilerp4(
        color,
        this.config.colorRange[0],
        this.config.colorRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random(),
      )

      multilerp3(
        vel,
        this.config.velRange[0],
        this.config.velRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
      )
      vec3.transformQuat(vel, vel, this.config.orientation)

      quat.slerp(
        rotVel,
        this.config.rotVelRange[0],
        this.config.rotVelRange[1],
        Math.random(),
      )
      // quat.multiply(rotVel, this.config.orientation, rotVel)

      add({
        ttl,
        orientation,
        translation,
        scale,
        color,
        vel,
        accel: this.config.gravity,
        rotVel,
      })
    }
  }

  public isActive(): boolean {
    return this.ttl === undefined || this.ttl > 0
  }
}

export const defaultBasicEmitterConfig: BasicEmitterConfig = {
  emitterTtl: undefined, // nonexpiring
  origin: vec3.create(),
  orientation: quat.fromEuler(quat.create(), 0, 90, 0),
  spawnRate: 40,
  particleTtlRange: [2, 3],
  orientationOffsetRange: [quat.create(), quat.create()],
  translationOffsetRange: [
    vec3.fromValues(-0.1, -0.1, -0.1),
    vec3.fromValues(0.1, 0.1, 0.1),
  ],
  scaleRange: [vec3.fromValues(0.1, 0.1, 0.1), vec3.fromValues(0.1, 0.1, 0.1)],
  colorRange: [vec4.fromValues(0, 0, 0, 1), vec4.fromValues(1, 1, 1, 1)],
  velRange: [vec3.fromValues(-0.5, -0.5, 2), vec3.fromValues(0.5, 0.5, 4.5)],
  rotVelRange: [
    quat.fromEuler(quat.create(), 5, 0, 0),
    quat.fromEuler(quat.create(), 15, 0, 0),
  ],
  gravity: vec3.fromValues(0, 0, 0),
}
