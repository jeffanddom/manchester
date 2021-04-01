import { vec3 } from 'gl-matrix'
import Slider, { Range } from 'rc-slider'
import React, { ReactElement, useState } from 'react'
import 'rc-slider/assets/index.css'

import { GradientPicker } from './GradientPicker'
import { ScaledRange } from './ScaledRange'
import { ScaledSlider } from './ScaledSlider'

import { BasicEmitter } from '~/particles/emitters/BasicEmitter'
import { Foldable } from '~/tools/particletoy/Foldable'
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
import { floatRgbToWebcolor, webcolorToFloatRgb } from '~/util/web'

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: 300,
  },
  row: {},
  header: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
  },
}

export const EmitterSettings = (props: {
  index: number
  emitter: BasicEmitter
  delete: () => void
}): ReactElement => {
  const mutableConfig = props.emitter.getMutableConfig()

  const [state, setState] = useState(mutableConfig)
  const [sphereOrientation, setSphereOrientation] = useState(
    // TODO: derive this from original orientation value
    sphereCoordFromValues(1, 0, 0),
  )
  const setStateWithSideEffect = () => setState({ ...mutableConfig })

  const updateSphereOrientation = (coord: SphereCoord): void => {
    const target = sphereCoordToVec3(vec3.create(), coord)
    quatLookAt(mutableConfig.orientation, Zero3, target, PlusZ3, PlusY3)
    setSphereOrientation([...coord])
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Emitter {props.index}</span>
        <button onClick={props.delete}>Delete</button>
      </div>

      <div style={styles.row}>
        <label>Spawn rate</label>
        <Slider
          min={0}
          max={1000}
          value={state.spawnRate}
          onChange={(v) => {
            mutableConfig.spawnRate = v
            setStateWithSideEffect()
          }}
        />
      </div>

      <Foldable title="Orientation">
        θ
        <ScaledSlider
          min={0}
          max={Math.PI}
          steps={100}
          value={sphereOrientation[SphereElement.Theta]}
          onChange={(v) => {
            sphereOrientation[SphereElement.Theta] = v
            updateSphereOrientation(sphereOrientation)
          }}
        />
        φ
        <ScaledSlider
          min={-Math.PI}
          max={Math.PI}
          steps={100}
          value={sphereOrientation[SphereElement.Phi]}
          onChange={(v) => {
            sphereOrientation[SphereElement.Phi] = v
            updateSphereOrientation(sphereOrientation)
          }}
        />
      </Foldable>

      <Foldable title="Origin">
        X
        <Slider
          min={-500}
          max={500}
          value={state.origin[0] * 100}
          onChange={(v) => {
            mutableConfig.origin[0] = v / 100
            setStateWithSideEffect()
          }}
        />
        Y
        <Slider
          min={-500}
          max={500}
          value={state.origin[1] * 100}
          onChange={(v) => {
            mutableConfig.origin[1] = v / 100
            setStateWithSideEffect()
          }}
        />
        Z
        <Slider
          min={-500}
          max={500}
          value={state.origin[2] * 100}
          onChange={(v) => {
            mutableConfig.origin[2] = v / 100
            setStateWithSideEffect()
          }}
        />
      </Foldable>

      <Foldable title="Scale">
        Width
        <ScaledRange
          min={0}
          max={2}
          steps={50}
          draggableTrack
          pushable
          value={[
            mutableConfig.scaleRange[0][0],
            mutableConfig.scaleRange[1][0],
          ]}
          onChange={([min, max]) => {
            mutableConfig.scaleRange[0][0] = min
            mutableConfig.scaleRange[1][0] = max
            setStateWithSideEffect()
          }}
        />
        Height
        <ScaledRange
          min={0}
          max={2}
          steps={50}
          draggableTrack
          pushable
          value={[
            mutableConfig.scaleRange[0][1],
            mutableConfig.scaleRange[1][1],
          ]}
          onChange={([min, max]) => {
            mutableConfig.scaleRange[0][1] = min
            mutableConfig.scaleRange[1][1] = max
            setStateWithSideEffect()
          }}
        />
      </Foldable>

      <Foldable title="Color">
        <GradientPicker
          min={floatRgbToWebcolor(mutableConfig.colorRange[0])}
          max={floatRgbToWebcolor(mutableConfig.colorRange[1])}
          onChange={(min, max) => {
            const rgbMin = webcolorToFloatRgb(min)
            mutableConfig.colorRange[0][0] = rgbMin[0]
            mutableConfig.colorRange[0][1] = rgbMin[1]
            mutableConfig.colorRange[0][2] = rgbMin[2]

            const rgbMax = webcolorToFloatRgb(max)
            mutableConfig.colorRange[1][0] = rgbMax[0]
            mutableConfig.colorRange[1][1] = rgbMax[1]
            mutableConfig.colorRange[1][2] = rgbMax[2]
            setStateWithSideEffect()
          }}
        ></GradientPicker>
        Alpha
        <Range
          min={0}
          max={100}
          draggableTrack
          pushable
          value={[
            mutableConfig.alphaRange[0] * 100,
            mutableConfig.alphaRange[1] * 100,
          ]}
          onChange={([min, max]) => {
            mutableConfig.alphaRange[0] = min / 100.0
            mutableConfig.alphaRange[1] = max / 100.0
            setStateWithSideEffect()
          }}
        />
      </Foldable>

      <Foldable title="Spread">
        Spread X
        <ScaledRange
          min={-3.14}
          max={3.14}
          steps={40}
          draggableTrack
          pushable
          marks={{
            10: { label: '-Pi/2', style: { color: 'white' } },
            20: { label: '0', style: { color: 'white' } },
            30: { label: '-Pi/2', style: { color: 'white' } },
          }}
          value={[mutableConfig.spreadXRange[0], mutableConfig.spreadXRange[1]]}
          onChange={([min, max]) => {
            mutableConfig.spreadXRange[0] = min
            mutableConfig.spreadXRange[1] = max
            setStateWithSideEffect()
          }}
        />
        Spread Y
        <ScaledRange
          min={-3.14}
          max={3.14}
          steps={40}
          draggableTrack
          pushable
          marks={{
            10: { label: '-Pi/2', style: { color: 'white' } },
            20: { label: '0', style: { color: 'white' } },
            30: { label: '-Pi/2', style: { color: 'white' } },
          }}
          value={[mutableConfig.spreadYRange[0], mutableConfig.spreadYRange[1]]}
          onChange={([min, max]) => {
            mutableConfig.spreadYRange[0] = min
            mutableConfig.spreadYRange[1] = max
            setStateWithSideEffect()
          }}
        />
      </Foldable>
      <Foldable title="Lifespan">
        Particle
        <ScaledRange
          min={0}
          max={4}
          steps={40}
          draggableTrack
          pushable
          value={[
            mutableConfig.particleTtlRange[0],
            mutableConfig.particleTtlRange[1],
          ]}
          onChange={([min, max]) => {
            mutableConfig.particleTtlRange[0] = min
            mutableConfig.particleTtlRange[1] = max
            setStateWithSideEffect()
          }}
        />
      </Foldable>
    </div>
  )
}
