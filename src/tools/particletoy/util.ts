import { quat, vec3 } from 'gl-matrix'
import React from 'react'

import { BasicEmitterConfig } from '~/particles/emitters/BasicEmitter'

export function valueToStep(
  value: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = Math.round((value - config.min) / stepSize)
  return res
}

export function stepToValue(
  step: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = config.min + step * stepSize
  return res
}

/**
 * A quick-and-dirty deep clone that doesn't handle class instances except for
 * Float32Array.
 */
export function deepClone<T>(obj: T): T {
  if (obj instanceof Float32Array) {
    return (obj.slice() as unknown) as T
  }

  if (Array.isArray(obj)) {
    return (obj.map(deepClone) as unknown) as T
  }

  if (typeof obj === 'object' && obj !== null) {
    const res: Partial<T> = {}
    for (const k in obj) {
      res[k] = deepClone(obj[k])
    }
    return res as T
  }

  // If we've gotten this far, we assume we've hit an immutable non-collection
  // value.
  return obj
}

/**
 * Create a deep clone of an object, replacing JSON-deserialized Float32Array
 * representations to actual Float32Array objects. When serialized to JSON,
 * Float32Array objects are converted to key/value objects with stringified
 * integer keys.
 *
 * This is a bit of a hack; we should consider making a bonafide serialization
 * format that is typesafe and does validation.
 */
export function deepRehydrateFloat32Arrays(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((elem) => deepRehydrateFloat32Arrays(elem))
  }

  if (typeof obj === 'object' && obj !== null) {
    if ('0' in obj) {
      return new Float32Array(Object.values(obj))
    }

    const typedObj = obj as Record<string, unknown>
    const res: Record<string, unknown> = {}
    for (const k in typedObj) {
      res[k] = deepRehydrateFloat32Arrays(typedObj[k])
    }
    return res
  }

  // We assume that obj is a non-collection immutable value.
  return obj
}

export function defaultBasicEmitterConfig(): BasicEmitterConfig {
  return {
    emitterTtl: undefined, // nonexpiring
    spawnRate: 40,
    particleTtlRange: [1, 2],
    translationOffsetRange: [
      vec3.fromValues(-0.1, -0.1, -0.1),
      vec3.fromValues(0.1, 0.1, 0.1),
    ],
    scaleRange: [
      vec3.fromValues(0.1, 0.1, 0.1),
      vec3.fromValues(0.1, 0.1, 0.1),
    ],
    colorRange: [vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1)],
    alphaRange: [1, 1],
    speedRange: [2, 4.5],
    rotVelRange: [
      quat.fromEuler(quat.create(), 5, 0, 0),
      quat.fromEuler(quat.create(), 15, 0, 0),
    ],
    gravity: vec3.fromValues(0, 0, 0),
    spreadXRange: [0, 0],
    spreadYRange: [0, 0],
  }
}

export const rightPaneContainerStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  padding: 10,
  borderRadius: 10,
  marginBottom: 10,
  width: 300,
}
