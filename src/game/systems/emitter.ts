import { quat, vec2, vec3 } from 'gl-matrix'

import { CommonAssets } from '~/common/assets/CommonAssets'
import {
  BasicEmitterSettings,
  emit,
} from '~/engine/particles/emitters/BasicEmitter'
import { ParticleConfig } from '~/engine/particles/interfaces'
import { EntityId } from '~/engine/state/EntityId'
import { StateDb } from '~/game/state/StateDb'
import { Immutable } from '~/types/immutable'
import { PlusY3, Zero2 } from '~/util/math'

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

export function update(stateDb: StateDb, dt: number): void {
  const toDelete: EntityId[] = []

  for (const [entityId, ec] of stateDb.emitters) {
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

    stateDb.emitters.update(entityId, {
      elapsed,
      leftoverParticles,
      particlesToRender,
    })
  }

  // Note: this is one place where we remove a component before the entire
  // entity is removed.
  for (const entityId of toDelete) {
    stateDb.emitters.delete(entityId)
  }
}

export const emitParticles: (
  stateDb: StateDb,
  addParticle: (config: Immutable<ParticleConfig>) => void,
) => void = (() => {
  // We use an immediately-evaluated function to close over some temporary
  // buffers that don't need to be re-allocated on every call.

  const rotatedPosOffset = vec2.create()
  const baseTranslation = vec3.create()
  const baseOrientation = quat.create()

  return (
    stateDb: StateDb,
    addParticle: (config: Immutable<ParticleConfig>) => void,
  ): void => {
    for (const [entityId, ec] of stateDb.emitters) {
      const transform = stateDb.transforms.get(entityId)!
      const shooter = stateDb.shooters.get(entityId)

      let orientation2: number = transform.orientation + ec.rotOffset
      let yOffset = 0.5
      if (shooter !== undefined) {
        orientation2 = shooter.orientation
        yOffset = 0.7
      }

      // Set base translation and orientation for particles
      vec2.rotate(rotatedPosOffset, ec.posOffset, Zero2, orientation2)

      baseTranslation[0] = transform.position[0] + rotatedPosOffset[0]
      baseTranslation[1] = yOffset // TODO: make this configurable when entities are in 3-space
      baseTranslation[2] = transform.position[1] + rotatedPosOffset[1]

      quat.setAxisAngle(
        baseOrientation,
        PlusY3,
        -orientation2, // negate when mapping 2-space +Y to 3-space -Z
      )

      for (let e = 0; e < ec.settings.length; e++) {
        const settings = ec.settings[e]
        const particlesToRender = ec.particlesToRender[e]
        for (let p = 0; p < particlesToRender; p++) {
          emit(settings, baseTranslation, baseOrientation, addParticle)
        }
      }
    }
  }
})()
