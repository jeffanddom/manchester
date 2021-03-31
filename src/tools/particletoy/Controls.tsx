import React, { useEffect, useState } from 'react'

import {
  BasicEmitter,
  BasicEmitterConfig,
  defaultBasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'
import { EmitterSettings } from '~/tools/particletoy/EmitterSettings'

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocalStorage = (emitters: BasicEmitter[]) => {
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

    const res: Record<string, unknown> = {}
    for (const k in input) {
      res[k] = deserializeConfig((input as Record<string, unknown>)[k])
    }
    return res
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
    <div onClick={() => updateLocalStorage(emitters)}>
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
            const newEmitter = addEmitter(defaultBasicEmitterConfig)
            setEmitters([...emitters, newEmitter])
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
            navigator.permissions
              .query({ name: 'clipboard-write' })
              .then((result) => {
                if (result.state === 'granted' || result.state === 'prompt') {
                  const text = window.localStorage.getItem(
                    EMITTER_STATE_STORAGE_KEY,
                  )
                  navigator.clipboard
                    .writeText(text === null ? '' : text)
                    .then(() => {
                      alert('Copied emitter JSON to clipboard')
                    })
                }
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
            emitter={e}
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
