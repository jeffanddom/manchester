import { quat, vec3 } from 'gl-matrix'
import React, { useEffect, useState } from 'react'

import {
  BasicEmitter,
  BasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'
import { EmitterSettings } from '~/tools/particletoy/EmitterSettings'

function defaultBasicEmitterConfig(): BasicEmitterConfig {
  return {
    emitterTtl: undefined, // nonexpiring
    origin: vec3.create(),
    orientation: quat.fromEuler(quat.create(), 0, 90, 0),
    spawnRate: 40,
    particleTtlRange: [1, 2],
    orientationOffsetRange: [quat.create(), quat.create()],
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
    velRange: [vec3.fromValues(-0.5, -0.5, 2), vec3.fromValues(0.5, 0.5, 4.5)],
    rotVelRange: [
      quat.fromEuler(quat.create(), 5, 0, 0),
      quat.fromEuler(quat.create(), 15, 0, 0),
    ],
    gravity: vec3.fromValues(0, 0, 0),
    spreadXRange: [0, 0],
    spreadYRange: [0, 0],
  }
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

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocalStorage = (emitters: BasicEmitter[]) => {
  window.localStorage.setItem(
    EMITTER_STATE_STORAGE_KEY,
    JSON.stringify(emitters.map((e) => e.getMutableConfig())),
  )
}

const loadFromLocalStorage = (): BasicEmitterConfig[] => {
  const serialized = window.localStorage.getItem(EMITTER_STATE_STORAGE_KEY)
  if (serialized === null) {
    return []
  }

  // TODO: we need bonafide content validation.
  const rawConfigs = JSON.parse(serialized) as unknown[]
  return rawConfigs.map((raw) => {
    // Start with default config, but overwrite with stored values.
    const config = defaultBasicEmitterConfig()
    const storedConfig = deepRehydrateFloat32Arrays(raw) as Record<
      string,
      unknown
    >

    for (const k in config) {
      if (k in storedConfig) {
        // This assignment requires disabling the typechecker because the values
        // of config are strictly typed, the values in storedConfig are not.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config[k] = storedConfig[k]
      }
    }

    return config
  })
}

interface EmitterWrapper {
  id: number
  emitter: BasicEmitter
}

let nextEmitterId = 0

export const Controls: React.FC<{
  createEmitter: (config: BasicEmitterConfig) => BasicEmitter
}> = ({ createEmitter }) => {
  const [emitters, setEmitters] = useState<EmitterWrapper[]>([])

  useEffect(() => {
    const newEmitters = []
    for (const config of loadFromLocalStorage()) {
      newEmitters.push({
        id: nextEmitterId,
        emitter: createEmitter(config),
      })
      nextEmitterId++
    }
    setEmitters([...newEmitters])
  }, [])

  return (
    <div onClick={() => updateLocalStorage(emitters.map((e) => e.emitter))}>
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 330,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          style={{ fontSize: 20, marginBottom: 10 }}
          onClick={() => {
            setEmitters([
              ...emitters,
              {
                id: nextEmitterId,
                emitter: createEmitter(defaultBasicEmitterConfig()),
              },
            ])
            nextEmitterId++
          }}
        >
          + Add Emitter
        </button>
        <button
          style={{ fontSize: 20, marginBottom: 10 }}
          onClick={(e) => {
            const jsonText = window.prompt('Paste emitter JSON here')
            if (jsonText === null) {
              return
            }

            try {
              const parsed = JSON.parse(jsonText)
              if (parsed !== undefined) {
                e.stopPropagation()
                window.localStorage.setItem(EMITTER_STATE_STORAGE_KEY, jsonText)
                window.location = window.location
              }
            } catch (err) {
              alert('There was an error parsing JSON')
            }
          }}
        >
          Import JSON
        </button>
        <button
          style={{ fontSize: 20, marginBottom: 10 }}
          onClick={() => {
            const text = window.localStorage.getItem(EMITTER_STATE_STORAGE_KEY)
            navigator.clipboard
              .writeText(text === null ? '' : text)
              .then(() => {
                alert('Copied emitter JSON to clipboard')
              })
          }}
        >
          Export JSON
        </button>
      </div>
      <div
        style={{
          padding: 10,
        }}
      >
        {emitters.map((e, i) => (
          <EmitterSettings
            key={e.id}
            index={i}
            emitter={e.emitter}
            delete={() => {
              emitters.splice(i, 1)
              setEmitters([...emitters])
            }}
          />
        ))}
      </div>
    </div>
  )
}
