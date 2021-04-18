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

/**
 * Emit particles using the provided BasicEmitterSettings. The particles will
 * share the same base translation and orientation.
 */
export const emit: (
  settings: Immutable<BasicEmitterSettings>,
  baseTranslation: vec3,
  baseOrientation: quat,
  addParticle: (config: ParticleConfig) => void,
) => void = (() => {
  // We use an immediately-evaluated function to close over some temporary
  // buffers that don't need to be re-allocated on every call.

  const translation = vec3.create()
  const orientation = quat.create()
  const rotVel = quat.create()
  const scale = vec3.create()
  const vel = vec3.create()
  const motionDir = vec3.create()
  const color = vec4.create()

  return (
    settings: Immutable<BasicEmitterSettings>,
    baseTranslation: Immutable<vec3>,
    baseOrientation: Immutable<quat>,
    addParticle: (config: ParticleConfig) => void,
  ): void => {
    const ttl = lerp(
      settings.particleTtlRange[0],
      settings.particleTtlRange[1],
      Math.random(),
    )

    multilerp3(
      translation,
      settings.translationOffsetRange[0],
      settings.translationOffsetRange[1],
      Math.random(),
      Math.random(),
      Math.random(),
    )
    vec3.transformQuat(translation, translation, baseOrientation)
    vec3.add(translation, translation, baseTranslation)

    multilerp3(
      scale,
      settings.scaleRange[0],
      settings.scaleRange[1],
      Math.random(),
      Math.random(),
      Math.random(),
    )

    // A consistent mix constant for each channel producees a gradient, which
    // is easier to visualize and reason about.
    const colorMix = Math.random()
    color[0] = lerp(
      settings.colorRange[0][0],
      settings.colorRange[1][0],
      colorMix,
    )
    color[1] = lerp(
      settings.colorRange[0][1],
      settings.colorRange[1][1],
      colorMix,
    )
    color[2] = lerp(
      settings.colorRange[0][2],
      settings.colorRange[1][2],
      colorMix,
    )
    color[3] = lerp(
      settings.alphaRange[0],
      settings.alphaRange[1],
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
      settings.spreadXRange[0],
      settings.spreadXRange[1],
      Math.random(),
    )
    const yrot = lerp(
      settings.spreadYRange[0],
      settings.spreadYRange[1],
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
    quat.multiply(orientation, baseOrientation, orientation)

    // Now apply the final orientation to velocity, and scaled by speed.
    vec3.transformQuat(motionDir, PlusZ3, orientation)
    vec3.scale(
      vel,
      motionDir,
      lerp(settings.speedRange[0], settings.speedRange[1], Math.random()),
    )

    quat.slerp(
      rotVel,
      settings.rotVelRange[0],
      settings.rotVelRange[1],
      Math.random(),
    )

    addParticle({
      ttl,
      orientation,
      translation,
      scale,
      color,
      vel,
      accel: settings.gravity,
      rotVel,
    })
  }
})()

/**
 * A fire-and-forget emitter. If you need the emitter origin/orientation to be
 * synchronized with entity state, use EntityComponent instead.
 */
export class BasicEmitter implements ParticleEmitter {
  private origin: vec3
  private orientation: quat

  private settings: Immutable<BasicEmitterSettings>

  private active: boolean
  private elapsed: number
  private leftoverParticles: number

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
    this.leftoverParticles = 0
  }

  public setOrigin(pos: Immutable<vec3>): void {
    vec3.copy(this.origin, pos)
  }

  public setOrientation(rot: Immutable<quat>): void {
    quat.copy(this.orientation, rot)
  }

  public deactivate(): void {
    this.active = false
  }

  public isActive(): boolean {
    return this.active
  }

  public update(
    dt: number,
    addParticle: (config: ParticleConfig) => void,
  ): void {
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

    this.leftoverParticles += this.settings.spawnRate * dt
    const particlesToRender = Math.floor(this.leftoverParticles)
    this.leftoverParticles -= particlesToRender

    for (let p = 0; p < particlesToRender; p++) {
      emit(this.settings, this.origin, this.orientation, addParticle)
    }
  }
}
