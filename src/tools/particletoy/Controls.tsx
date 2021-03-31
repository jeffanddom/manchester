import React, { useEffect, useState } from 'react'

import {
  BasicEmitter,
  BasicEmitterConfig,
  defaultBasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'
import { EmitterSettings } from '~/tools/particletoy/EmitterSettings'

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
    <div onClick={() => updateLocatStorage(emitters)}>
      <button
        style={{ position: 'fixed', top: 10, right: 330, fontSize: 20 }}
        onClick={() => {
          const newEmitter = addEmitter(defaultBasicEmitterConfig)
          setEmitters([...emitters, newEmitter])
        }}
      >
        + Add Emitter
      </button>
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
              console.log('deleting ', i)
              emitters.splice(i, 1)
              setEmitters([...emitters])
            }}
          />
        ))}
      </div>
    </div>
  )
}
