import { quat, vec3, vec4 } from 'gl-matrix'

import { ParticleConfig, ParticleEmitter } from '~/particles/interfaces'
import { lerp, multilerp3 } from '~/util/math'

export interface BasicEmitterConfig {
  emitterTtl: number | undefined // undefined = nonexpiring
  origin: vec3
  orientation: quat
  spawnRate: number

  particleTtlRange: [number, number]

  // initial attribs
  translationOffsetRange: [vec3, vec3] // will be transformed by origin & orientation
  scaleRange: [vec3, vec3] // will NOT be transformed by orientation
  colorRange: [vec3, vec3]
  alphaRange: [number, number]
  spreadXRange: [number, number]
  spreadYRange: [number, number]

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
  private tempQuat: [quat, quat, quat]
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

    this.tempQuat = [quat.create(), quat.create(), quat.create()]
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

    const [orientation, rotVel, velTemp] = this.tempQuat
    const [translation, scale, vel] = this.tempVec3
    const [color] = this.tempVec4

    while (this.potentialParticles >= 1) {
      this.potentialParticles -= 1

      const ttl = lerp(
        this.config.particleTtlRange[0],
        this.config.particleTtlRange[1],
        Math.random(),
      )

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

      // A consistent mix constant for each channel producees a gradient, which
      // is easier to visualize and reason about.
      const colorMix = Math.random()
      color[0] = lerp(
        this.config.colorRange[0][0],
        this.config.colorRange[1][0],
        colorMix,
      )
      color[1] = lerp(
        this.config.colorRange[0][1],
        this.config.colorRange[1][1],
        colorMix,
      )
      color[2] = lerp(
        this.config.colorRange[0][2],
        this.config.colorRange[1][2],
        colorMix,
      )
      color[3] = lerp(
        this.config.alphaRange[0],
        this.config.alphaRange[1],
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

      // Spread
      quat.identity(velTemp)
      const xSpread = lerp(
        this.config.spreadXRange[0],
        this.config.spreadXRange[1],
        Math.random(),
      )
      vec3.transformQuat(vel, vel, quat.rotateY(velTemp, velTemp, xSpread))
      quat.identity(velTemp)
      const ySpread = lerp(
        this.config.spreadYRange[0],
        this.config.spreadYRange[1],
        Math.random(),
      )
      vec3.transformQuat(vel, vel, quat.rotateZ(velTemp, velTemp, ySpread))

      quat.slerp(
        rotVel,
        this.config.rotVelRange[0],
        this.config.rotVelRange[1],
        Math.random(),
      )

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
