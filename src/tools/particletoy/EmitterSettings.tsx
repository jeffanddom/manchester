import Slider, { Range } from 'rc-slider'
import React, { ReactElement, useState } from 'react'
import 'rc-slider/assets/index.css'

import { ScaledRange } from './ScaledRange'

import { BasicEmitter } from '~/particles/emitters/BasicEmitter'
import { Foldable } from '~/tools/particletoy/Foldable'

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
  const setStateWithSideEffect = () => setState({ ...mutableConfig })

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
        R
        <Range
          min={0}
          max={255}
          value={[
            mutableConfig.colorRange[0][0] * 255,
            mutableConfig.colorRange[1][0] * 255,
          ]}
          onChange={([min, max]) => {
            mutableConfig.colorRange[0][0] = min / 255.0
            mutableConfig.colorRange[1][0] = max / 255.0
            setStateWithSideEffect()
          }}
        />
        G
        <Range
          min={0}
          max={255}
          value={[
            mutableConfig.colorRange[0][1] * 255,
            mutableConfig.colorRange[1][1] * 255,
          ]}
          onChange={([min, max]) => {
            mutableConfig.colorRange[0][1] = min / 255.0
            mutableConfig.colorRange[1][1] = max / 255.0
            setStateWithSideEffect()
          }}
        />
        B
        <Range
          min={0}
          max={255}
          value={[
            mutableConfig.colorRange[0][2] * 255,
            mutableConfig.colorRange[1][2] * 255,
          ]}
          onChange={([min, max]) => {
            mutableConfig.colorRange[0][2] = min / 255.0
            mutableConfig.colorRange[1][2] = max / 255.0
            setStateWithSideEffect()
          }}
        />
        A
        <Range
          min={0}
          max={100}
          value={[
            mutableConfig.colorRange[0][3] * 100,
            mutableConfig.colorRange[1][3] * 100,
          ]}
          onChange={([min, max]) => {
            mutableConfig.colorRange[0][3] = min / 100.0
            mutableConfig.colorRange[1][3] = max / 100.0
            setStateWithSideEffect()
          }}
        />
      </Foldable>
    </div>
  )
}
