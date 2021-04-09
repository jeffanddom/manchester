import { quat, vec3 } from 'gl-matrix'
import React from 'react'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'

export function valueToStep(
  value: number,
  config: { min: number; max: number; steps: number; exponential?: boolean },
): number {
  if (config.exponential ?? false) {
    const shift = config.min > 0 ? 0 : 1 - config.min
    const scaleMin = config.min + shift
    const scaleMax = config.max + shift
    const root = Math.pow(scaleMax / scaleMin, 1 / (config.steps - 1))
    return Math.log((value + shift) / scaleMin) / Math.log(root)
  } else {
    const stepSize = (config.max - config.min) / config.steps
    const res = Math.round((value - config.min) / stepSize)
    return res
  }
}

export function stepToValue(
  step: number,
  config: { min: number; max: number; steps: number; exponential?: boolean },
): number {
  if (config.exponential ?? false) {
    const shift = config.min > 0 ? 0 : 1 - config.min
    const scaleMin = config.min + shift
    const scaleMax = config.max + shift
    const root = Math.pow(scaleMax / scaleMin, 1 / (config.steps - 1))
    const scaleVal = scaleMin * Math.pow(root, step)
    return scaleVal - shift
  } else {
    const stepSize = (config.max - config.min) / config.steps
    const res = config.min + step * stepSize
    return res
  }
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

export function defaultBasicEmitterConfig(): BasicEmitterSettings {
  return {
    nonexpiring: false,
    emitterTtl: 2,
    startOffset: 0,
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
