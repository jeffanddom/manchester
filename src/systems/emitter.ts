import { quat, vec2, vec3, vec4 } from 'gl-matrix'

import { CommonAssets } from '~/assets/CommonAssets'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { ParticleConfig } from '~/particles/interfaces'
import { Immutable } from '~/types/immutable'
import {
  MinusZ3,
  PlusY3,
  PlusZ3,
  Zero2,
  Zero3,
  lerp,
  multilerp3,
  quatLookAt,
  sphereCoordFromValues,
  sphereCoordToVec3,
} from '~/util/math'

export interface EmitterComponent {
  // TODO: support multiple emitter sets
  posOffset: vec2
  rotOffset: number
  elapsed: number

  // Per emitter
  settings: Immutable<BasicEmitterSettings>[]
  leftoverParticles: number[]
  // particlesToRender is calculated in update(), but consumed in render().
  // It doesn't need to be synchronized per se, but we need a place to store
  // this data.
  particlesToRender: number[]
}

export function make(
  emitterAssetId: string,
  posOffset: vec2,
  rotOffset: number,
): EmitterComponent {
  return {
    posOffset,
    rotOffset,
    elapsed: 0,
    settings: CommonAssets.emitters.get(emitterAssetId)!,
    leftoverParticles: [],
    particlesToRender: [],
  }
}

export function emitterClone(
  src: Immutable<EmitterComponent>,
): EmitterComponent {
  return {
    posOffset: vec2.clone(src.posOffset),
    rotOffset: src.rotOffset,
    elapsed: src.elapsed,
    settings: src.settings as BasicEmitterSettings[],
    leftoverParticles: src.leftoverParticles.slice(),
    particlesToRender: [],
  }
}

export function update(entityManager: EntityManager, dt: number): void {
  const toDelete: EntityId[] = []

  for (const [entityId, ec] of entityManager.emitters) {
    const elapsed = ec.elapsed + dt
    const leftoverParticles: number[] = []
    const particlesToRender: number[] = []

    let setActive = false

    // Update each emitter in the set.
    for (let i = 0; i < ec.settings.length; i++) {
      leftoverParticles[i] = ec.leftoverParticles[i] ?? 0
      particlesToRender[i] = 0

      if (!ec.settings[i].nonexpiring && elapsed >= ec.settings[i].emitterTtl) {
        continue
      }

      setActive = true

      if (elapsed < ec.settings[i].startOffset) {
        continue
      }

      leftoverParticles[i] += ec.settings[i].spawnRate * dt
      particlesToRender[i] = Math.floor(leftoverParticles[i])
      leftoverParticles[i] -= particlesToRender[i]
    }

    if (!setActive) {
      toDelete.push(entityId)

      // No need to update this component, because we're going to delete it.
      continue
    }

    entityManager.emitters.update(entityId, {
      elapsed,
      leftoverParticles,
      particlesToRender,
    })
  }

  // Note: this is one place where we remove a component before the entire
  // entity is removed.
  for (const entityId of toDelete) {
    entityManager.emitters.delete(entityId)
  }
}

// temporaries
const rotatedPosOffset = vec2.create()
const baseTranslation = vec3.create()
const baseOrientation = quat.create()
const translation = vec3.create()
const orientation = quat.create()
const rotVel = quat.create()
const scale = vec3.create()
const vel = vec3.create()
const motionDir = vec3.create()
const color = vec4.create()

export function render(
  entityManager: EntityManager,
  add: (config: ParticleConfig) => void,
): void {
  for (const [entityId, ec] of entityManager.emitters) {
    const transform = entityManager.transforms.get(entityId)!

    // Set base translation and orientation for particles
    const orientation2 = transform.orientation + ec.rotOffset
    vec2.rotate(rotatedPosOffset, ec.posOffset, Zero2, orientation2)

    baseTranslation[0] = transform.position[0] + rotatedPosOffset[0]
    baseTranslation[1] = 0.5 // TODO: make this configurable when entities are in 3-space
    baseTranslation[2] = transform.position[1] + rotatedPosOffset[1]

    quat.fromEuler(
      baseOrientation,
      0,
      -orientation2, // negate when mapping 2-space +Y to 3-space -Z
      0,
    )

    for (let e = 0; e < ec.settings.length; e++) {
      const settings = ec.settings[e]

      for (let p = 0; p < ec.particlesToRender[e]; p++) {
        // TODO: this is copied from BasicEmitter. Figure out if there's an easy
        // way to DRY this up. The use of temporaries makes it slightly ugly.
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

        add({
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
    }
  }
}
