import { quat, vec3 } from 'gl-matrix'
import React, { useEffect, useState } from 'react'

import { Foldable } from './Foldable'
import { ScaledSlider } from './ScaledSlider'
import {
  deepClone,
  deepRehydrateFloat32Arrays,
  defaultBasicEmitterConfig as defaultBasicEmitterSettings,
  rightPaneContainerStyle,
} from './util'

import {
  BasicEmitter,
  BasicEmitterSettings,
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

function sanitizeSettings(
  settings: Partial<BasicEmitterSettings>,
): BasicEmitterSettings {
  // Start with default config, but overwrite with valid incoming values.
  const newSettings = defaultBasicEmitterSettings()

  for (const k in newSettings) {
    if (k in settings) {
      // This assignment requires disabling the typechecker it does not
      // recognize that we're copying record values key over key.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newSettings[k] = deepClone(settings[k])
    }
  }

  return newSettings
}

const EMITTER_STATE_STORAGE_KEY = 'emitterState'

const updateLocalStorage = (settings: BasicEmitterSettings[]) => {
  window.localStorage.setItem(
    EMITTER_STATE_STORAGE_KEY,
    JSON.stringify(settings.map((s) => sanitizeSettings(s))),
  )
}

const loadFromLocalStorage = (): BasicEmitterSettings[] => {
  const serialized = window.localStorage.getItem(EMITTER_STATE_STORAGE_KEY)
  if (serialized === null) {
    return []
  }

  // TODO: we need bonafide content validation.
  const rawSettings = JSON.parse(serialized) as unknown[]
  return rawSettings.map((raw) => {
    const settings = deepRehydrateFloat32Arrays(raw)
    return sanitizeSettings(settings as Partial<BasicEmitterSettings>)
  })
}

interface EmitterWrapper {
  id: number
  emitter: BasicEmitter
  settings: BasicEmitterSettings
}

let nextEmitterId = 0

export const Controls: React.FC<{
  createEmitter: (
    origin: Immutable<vec3>,
    orientation: Immutable<quat>,
    config: BasicEmitterSettings,
  ) => BasicEmitter
}> = ({ createEmitter }) => {
  const [emitterData, setEmitters] = useState<EmitterWrapper[]>([])
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
    for (const d of emitterData) {
      d.emitter.setOrientation(quatOrientation)
    }

    // Update UI
    setCommonOrientation([...coord])
  }

  useEffect(() => {
    const newEmitters = []
    for (const settings of loadFromLocalStorage()) {
      newEmitters.push({
        id: nextEmitterId,
        emitter: createEmitter(vec3.create(), quat.create(), settings),
        settings,
      })
      nextEmitterId++
    }
    setEmitters([...newEmitters])
  }, [])

  return (
    <div onClick={() => updateLocalStorage(emitterData.map((e) => e.settings))}>
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
            const settings = defaultBasicEmitterSettings()

            setEmitters([
              ...emitterData,
              {
                id: nextEmitterId,
                emitter: createEmitter(
                  vec3.create(),
                  quatOrientation,
                  settings,
                ),
                settings,
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

        {emitterData.map((e, i) => (
          <EmitterSettings
            key={e.id}
            index={i}
            settings={e.settings}
            delete={() => {
              emitterData.splice(i, 1)
              setEmitters([...emitterData])
            }}
          />
        ))}
      </div>
    </div>
  )
}
