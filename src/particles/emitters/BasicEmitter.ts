import { quat, vec3, vec4 } from 'gl-matrix'

import { ParticleConfig, ParticleEmitter } from '~/particles/interfaces'
import { Immutable } from '~/types/immutable'
import {
  MinusZ3,
  PlusY3,
  PlusZ3,
  Zero3,
  lerp,
  multilerp3,
  quatLookAt,
  sphereCoordFromValues,
  sphereCoordToVec3,
} from '~/util/math'

export interface BasicEmitterSettings {
  nonexpiring: boolean
  emitterTtl: number // ignore if nonexpiring
  startOffset: number
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
  speedRange: [number, number]
  gravity: vec3 // a constant global acceleration, will NOT be transformed by orientation
  rotVelRange: [quat, quat] // will be transformed by orientation
}

export class BasicEmitter implements ParticleEmitter {
  private origin: vec3
  private orientation: quat

  private settings: Immutable<BasicEmitterSettings>

  private active: boolean
  private elapsed: number
  private potentialParticles: number

  // temporaries
  private tempQuat: [quat, quat]
  private tempVec3: [vec3, vec3, vec3, vec3]
  private tempVec4: [vec4]

  constructor(
    origin: Immutable<vec3>,
    orientation: Immutable<quat>,
    settings: Immutable<BasicEmitterSettings>,
  ) {
    this.origin = vec3.copy(vec3.create(), origin)
    this.orientation = quat.copy(quat.create(), orientation)

    this.settings = settings

    this.active = true
    this.elapsed = 0
    this.potentialParticles = 0

    this.tempQuat = [quat.create(), quat.create()]
    this.tempVec3 = [vec3.create(), vec3.create(), vec3.create(), vec3.create()]
    this.tempVec4 = [vec4.create()]
  }

  public setOrigin(pos: Immutable<vec3>): void {
    vec3.copy(this.origin, pos)
  }

  public setOrientation(rot: Immutable<quat>): void {
    quat.copy(this.orientation, rot)
  }

  public update(dt: number, add: (config: ParticleConfig) => void): void {
    if (!this.active) {
      return
    }

    if (!this.settings.nonexpiring) {
      this.elapsed += dt

      if (this.elapsed >= this.settings.emitterTtl) {
        this.active = false
        return
      }

      if (this.elapsed < this.settings.startOffset) {
        return
      }
    }

    this.potentialParticles += this.settings.spawnRate * dt

    const [orientation, rotVel] = this.tempQuat
    const [translation, scale, vel, motionDir] = this.tempVec3
    const [color] = this.tempVec4

    while (this.potentialParticles >= 1) {
      this.potentialParticles -= 1

      const ttl = lerp(
        this.settings.particleTtlRange[0],
        this.settings.particleTtlRange[1],
        Math.random(),
      )

      multilerp3(
        translation,
        this.settings.translationOffsetRange[0],
        this.settings.translationOffsetRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
      )
      vec3.transformQuat(translation, translation, this.orientation)
      vec3.add(translation, translation, this.origin)

      multilerp3(
        scale,
        this.settings.scaleRange[0],
        this.settings.scaleRange[1],
        Math.random(),
        Math.random(),
        Math.random(),
      )

      // A consistent mix constant for each channel producees a gradient, which
      // is easier to visualize and reason about.
      const colorMix = Math.random()
      color[0] = lerp(
        this.settings.colorRange[0][0],
        this.settings.colorRange[1][0],
        colorMix,
      )
      color[1] = lerp(
        this.settings.colorRange[0][1],
        this.settings.colorRange[1][1],
        colorMix,
      )
      color[2] = lerp(
        this.settings.colorRange[0][2],
        this.settings.colorRange[1][2],
        colorMix,
      )
      color[3] = lerp(
        this.settings.alphaRange[0],
        this.settings.alphaRange[1],
        Math.random(),
      )

      // Spread represents a spherical coordinate range, expressed as:
      // - X spread: a pair of rotations around the Y axis, relative to +Z.
      // - Y spread: a pair of rotations around the X axis, relative to +Z.
      //
      // We want to convert these to theta/phi values. The X spread is equal to
      // phi without modification. The Y spread is equal to (theta - pi/2).
      // Converting these to a vec3 gives us a motion vector.
      const xrot = lerp(
        this.settings.spreadXRange[0],
        this.settings.spreadXRange[1],
        Math.random(),
      )
      const yrot = lerp(
        this.settings.spreadYRange[0],
        this.settings.spreadYRange[1],
        Math.random(),
      )
      sphereCoordToVec3(
        motionDir,
        sphereCoordFromValues(1, yrot + Math.PI / 2, xrot),
      )

      // We will orient the particle locally to face along the motion vector.
      // We then use the resulting orientation as a base rotation, which we
      // modify by the emitter's rotation to get the final post rotation value.
      quatLookAt(orientation, Zero3, motionDir, MinusZ3, PlusY3)
      quat.multiply(orientation, this.orientation, orientation)

      // Now apply the final orientation to velocity, and scaled by speed.
      vec3.transformQuat(motionDir, PlusZ3, orientation)
      vec3.scale(
        vel,
        motionDir,
        lerp(
          this.settings.speedRange[0],
          this.settings.speedRange[1],
          Math.random(),
        ),
      )

      quat.slerp(
        rotVel,
        this.settings.rotVelRange[0],
        this.settings.rotVelRange[1],
        Math.random(),
      )

      add({
        ttl,
        orientation,
        translation,
        scale,
        color,
        vel,
        accel: this.settings.gravity,
        rotVel,
      })
    }
  }

  public deactivate(): void {
    this.active = false
  }

  public isActive(): boolean {
    return this.active
  }
}
