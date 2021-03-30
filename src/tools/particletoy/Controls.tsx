import { quat, vec3, vec4 } from 'gl-matrix'
import React, { useEffect, useState } from 'react'

import { EmitterSettings } from './EmitterSettings'

import {
  BasicEmitter,
  BasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocatStorage = (emitters: BasicEmitter[]) => {
  window.localStorage.setItem(
    EMITTER_STATE_STORAGE_KEY,
    JSON.stringify(emitters.map((e) => e.getMutableConfig())),
  )
}

const deserializeConfig = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map(deserializeConfig)
  }

  if (typeof input === 'object') {
    if (input === null) {
      return null
    }

    if ('0' in input) {
      return new Float32Array(Object.values(input))
    }
  }

  // primitive types
  return input
}

const loadFromLocalStorage = () => {
  const stringified = window.localStorage.getItem(EMITTER_STATE_STORAGE_KEY)
  if (stringified === null) {
    return []
  }

  const stored = JSON.parse(stringified)
  return stored.map(deserializeConfig)
}

export const Controls: React.FC<{
  addEmitter: (config: BasicEmitterConfig) => BasicEmitter
}> = ({ addEmitter }) => {
  const [emitters, setEmitters] = useState<BasicEmitter[]>([])

  useEffect(() => {
    const emitterConfigs = loadFromLocalStorage()

    const newEmitters = []
    for (const config of emitterConfigs) {
      newEmitters.push(addEmitter(config))
    }
    setEmitters([...newEmitters])
  }, [])

  return (
    <div onClick={() => updateLocatStorage(emitters)}>
      <button
        onClick={() => {
          const newEmitter = addEmitter({
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
            scaleRange: [
              vec3.fromValues(0.1, 0.1, 0.1),
              vec3.fromValues(0.1, 0.1, 0.1),
            ],
            colorRange: [
              vec4.fromValues(0, 0, 0, 1),
              vec4.fromValues(1, 1, 1, 1),
            ],
            velRange: [
              vec3.fromValues(-0.5, -0.5, 2),
              vec3.fromValues(0.5, 0.5, 4.5),
            ],
            rotVelRange: [
              quat.fromEuler(quat.create(), 5, 0, 0),
              quat.fromEuler(quat.create(), 15, 0, 0),
            ],
            gravity: vec3.fromValues(0, 0, 0),
          })
          setEmitters([...emitters, newEmitter])
        }}
      >
        +
      </button>
      {emitters.map((e, i) => (
        <EmitterSettings key={i} emitter={e} />
      ))}
    </div>
  )
}
