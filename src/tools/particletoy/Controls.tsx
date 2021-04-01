import { quat } from 'gl-matrix'
import React, { useEffect, useState } from 'react'

import {
  deepClone,
  deepRehydrateFloat32Arrays,
  defaultBasicEmitterConfig,
} from './util'

import {
  BasicEmitter,
  BasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'
import { EmitterSettings } from '~/tools/particletoy/EmitterSettings'

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocalStorage = (emitters: BasicEmitter[]) => {
  window.localStorage.setItem(
    EMITTER_STATE_STORAGE_KEY,
    JSON.stringify(
      emitters.map((e) => {
        // Orientation is just for display purposes, don't save it to storage.
        const copy = deepClone(e.getMutableConfig())
        copy.orientation = quat.create()
        return copy
      }),
    ),
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
        // Skip orientation, which is for display purposes only.
        if (k === 'orientation') {
          continue
        }

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
