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

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
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

interface EmitterSettingsWrapper {
  id: number
  settings: BasicEmitterSettings
}

let nextEmitterId = 0

export function Controls(props: {
  createEmitter: (settings: Immutable<BasicEmitterSettings>) => void
  removeEmitter: (index: number) => void
  setOrientation: (orientation: Immutable<quat>) => void
}): React.ReactElement {
  const [emitterSettingsState, setEmitterSettingsState] = useState<
    EmitterSettingsWrapper[]
  >([])
  const [orientation, setOrientation] = useState(
    sphereCoordFromValues(1, Math.PI / 2, 0),
  )

  const onOrientationChange = (coord: SphereCoord): void => {
    const target = sphereCoordToVec3(vec3.create(), coord)
    props.setOrientation(
      quatLookAt(quat.create(), Zero3, target, PlusZ3, PlusY3),
    )

    // Update UI
    setOrientation([...coord])
  }

  const appendEmitter = (settings: BasicEmitterSettings): void => {
    props.createEmitter(settings)

    emitterSettingsState.push({
      id: nextEmitterId,
      settings,
    })
    setEmitterSettingsState([...emitterSettingsState])

    nextEmitterId++
  }

  useEffect(() => {
    for (const settings of loadFromLocalStorage()) {
      appendEmitter(settings)
    }
  }, [])

  return (
    <div
      onClick={() =>
        updateLocalStorage(emitterSettingsState.map((e) => e.settings))
      }
    >
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
          onClick={() => appendEmitter(defaultBasicEmitterSettings())}
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
              value={orientation[SphereElement.Theta]}
              onChange={(v) => {
                orientation[SphereElement.Theta] = v
                onOrientationChange(orientation)
              }}
            />
            φ Azimuth
            <ScaledSlider
              min={-Math.PI}
              max={Math.PI}
              marks={{ 50: { label: '0', style: { color: 'white' } } }}
              steps={100}
              value={orientation[SphereElement.Phi]}
              onChange={(v) => {
                orientation[SphereElement.Phi] = v
                onOrientationChange(orientation)
              }}
            />
          </Foldable>
        </div>

        {emitterSettingsState.map((e, i) => (
          <EmitterSettings
            key={e.id}
            index={i}
            settings={e.settings}
            delete={() => {
              props.removeEmitter(i)
              emitterSettingsState.splice(i, 1)
              setEmitterSettingsState([...emitterSettingsState])
            }}
          />
        ))}
      </div>
    </div>
  )
}
