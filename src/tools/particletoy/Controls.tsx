import { quat, vec3 } from 'gl-matrix'
import React, { useEffect, useState } from 'react'

import { Foldable } from './Foldable'
import { ScaledSlider } from './ScaledSlider'
import {
  deepClone,
  deepRehydrateFloat32Arrays,
  defaultBasicEmitterConfig,
  rightPaneContainerStyle,
} from './util'

import {
  BasicEmitter,
  BasicEmitterConfig,
} from '~/particles/emitters/BasicEmitter'
import { EmitterSettings } from '~/tools/particletoy/EmitterSettings'
import { Immutable } from '~/types/immutable'
import {
  PlusY3,
  PlusZ3,
  SphereCoord,
  SphereElement,
  Zero3,
  quatLookAt,
  sphereCoordFromValues,
  sphereCoordToVec3,
} from '~/util/math'

function sanitizeConfig(
  config: Partial<BasicEmitterConfig>,
): BasicEmitterConfig {
  // Start with default config, but overwrite with valid incoming values.
  const newConfig = defaultBasicEmitterConfig()

  for (const k in newConfig) {
    if (k in config) {
      // Skip orientation and origin, which are meant to be set via runtime
      // code.
      if (k === 'orientation' || k === 'origin') {
        continue
      }

      // This assignment requires disabling the typechecker it does not
      // recognize that we're copying record values key over key.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newConfig[k] = deepClone(config[k])
    }
  }

  return newConfig
}

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocalStorage = (emitters: BasicEmitter[]) => {
  window.localStorage.setItem(
    EMITTER_STATE_STORAGE_KEY,
    JSON.stringify(emitters.map((e) => sanitizeConfig(e.getMutableConfig()))),
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
    const storedConfig = deepRehydrateFloat32Arrays(raw)
    return sanitizeConfig(storedConfig as Partial<BasicEmitterConfig>)
  })
}

interface EmitterWrapper {
  id: number
  emitter: BasicEmitter
}

let nextEmitterId = 0

export const Controls: React.FC<{
  createEmitter: (
    origin: Immutable<vec3>,
    orientation: Immutable<quat>,
    config: BasicEmitterConfig,
  ) => BasicEmitter
}> = ({ createEmitter }) => {
  const [emitters, setEmitters] = useState<EmitterWrapper[]>([])
  const [commonOrientation, setCommonOrientation] = useState(
    sphereCoordFromValues(1, Math.PI / 2, 0),
  )

  const onCommonOrientationChange = (coord: SphereCoord): void => {
    // Calculate quaternion representation.
    const target = sphereCoordToVec3(vec3.create(), coord)
    const quatOrientation = quatLookAt(
      quat.create(),
      Zero3,
      target,
      PlusZ3,
      PlusY3,
    )

    // Update emitters
    for (const e of emitters) {
      e.emitter.setOrientation(quatOrientation)
    }

    // Update UI
    setCommonOrientation([...coord])
  }

  useEffect(() => {
    const newEmitters = []
    for (const config of loadFromLocalStorage()) {
      newEmitters.push({
        id: nextEmitterId,
        emitter: createEmitter(vec3.create(), quat.create(), config),
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
            const target = sphereCoordToVec3(vec3.create(), commonOrientation)
            const quatOrientation = quatLookAt(
              quat.create(),
              Zero3,
              target,
              PlusZ3,
              PlusY3,
            )

            setEmitters([
              ...emitters,
              {
                id: nextEmitterId,
                emitter: createEmitter(
                  vec3.create(),
                  quatOrientation,
                  defaultBasicEmitterConfig(),
                ),
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
        <div style={rightPaneContainerStyle}>
          <Foldable title="Orientation">
            θ Inclination
            <ScaledSlider
              min={0}
              max={Math.PI}
              marks={{ 50: { label: 'π/2', style: { color: 'white' } } }}
              steps={100}
              value={commonOrientation[SphereElement.Theta]}
              onChange={(v) => {
                commonOrientation[SphereElement.Theta] = v
                onCommonOrientationChange(commonOrientation)
              }}
            />
            φ Azimuth
            <ScaledSlider
              min={-Math.PI}
              max={Math.PI}
              marks={{ 50: { label: '0', style: { color: 'white' } } }}
              steps={100}
              value={commonOrientation[SphereElement.Phi]}
              onChange={(v) => {
                commonOrientation[SphereElement.Phi] = v
                onCommonOrientationChange(commonOrientation)
              }}
            />
          </Foldable>
        </div>

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
