import Slider, { Range } from 'rc-slider'
import React, { ReactElement, useState } from 'react'
import 'rc-slider/assets/index.css'

import { GradientPicker } from './GradientPicker'
import { ScaledRange } from './ScaledRange'
import { rightPaneContainerStyle } from './util'

import { BasicEmitterSettings } from '~/particles/emitters/BasicEmitter'
import { Foldable } from '~/tools/particletoy/Foldable'
import { floatRgbToWebcolor, webcolorToFloatRgb } from '~/util/web'

const styles: { [key: string]: React.CSSProperties } = {
  container: rightPaneContainerStyle,
  row: {},
  header: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
  },
}

export const EmitterSettings = (props: {
  index: number
  settings: BasicEmitterSettings
  delete: () => void
}): ReactElement => {
  const [state, setState] = useState(0)
  const forceUpdate = () => {
    setState(state + 1)
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
          value={props.settings.spawnRate}
          onChange={(v) => {
            props.settings.spawnRate = v
            forceUpdate()
          }}
        />
      </div>

      <Foldable title="Scale">
        Width
        <ScaledRange
          min={0}
          max={2}
          steps={50}
          draggableTrack
          pushable
          value={[
            props.settings.scaleRange[0][0],
            props.settings.scaleRange[1][0],
          ]}
          onChange={([min, max]) => {
            props.settings.scaleRange[0][0] = min
            props.settings.scaleRange[1][0] = max
            forceUpdate()
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
            props.settings.scaleRange[0][1],
            props.settings.scaleRange[1][1],
          ]}
          onChange={([min, max]) => {
            props.settings.scaleRange[0][1] = min
            props.settings.scaleRange[1][1] = max
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Color">
        <GradientPicker
          min={floatRgbToWebcolor(props.settings.colorRange[0])}
          max={floatRgbToWebcolor(props.settings.colorRange[1])}
          onChange={(min, max) => {
            const rgbMin = webcolorToFloatRgb(min)
            props.settings.colorRange[0][0] = rgbMin[0]
            props.settings.colorRange[0][1] = rgbMin[1]
            props.settings.colorRange[0][2] = rgbMin[2]

            const rgbMax = webcolorToFloatRgb(max)
            props.settings.colorRange[1][0] = rgbMax[0]
            props.settings.colorRange[1][1] = rgbMax[1]
            props.settings.colorRange[1][2] = rgbMax[2]
            forceUpdate()
          }}
        ></GradientPicker>
        Alpha
        <Range
          min={0}
          max={100}
          draggableTrack
          pushable
          value={[
            props.settings.alphaRange[0] * 100,
            props.settings.alphaRange[1] * 100,
          ]}
          onChange={([min, max]) => {
            props.settings.alphaRange[0] = min / 100.0
            props.settings.alphaRange[1] = max / 100.0
            forceUpdate()
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
          value={[
            props.settings.spreadXRange[0],
            props.settings.spreadXRange[1],
          ]}
          onChange={([min, max]) => {
            props.settings.spreadXRange[0] = min
            props.settings.spreadXRange[1] = max
            forceUpdate()
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
          value={[
            props.settings.spreadYRange[0],
            props.settings.spreadYRange[1],
          ]}
          onChange={([min, max]) => {
            props.settings.spreadYRange[0] = min
            props.settings.spreadYRange[1] = max
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Speed">
        <ScaledRange
          min={0}
          max={10}
          steps={100}
          draggableTrack
          pushable
          value={[props.settings.speedRange[0], props.settings.speedRange[1]]}
          onChange={([min, max]) => {
            props.settings.speedRange[0] = min
            props.settings.speedRange[1] = max
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Particle TTL">
        <ScaledRange
          min={0}
          max={4}
          steps={40}
          draggableTrack
          pushable
          value={[
            props.settings.particleTtlRange[0],
            props.settings.particleTtlRange[1],
          ]}
          onChange={([min, max]) => {
            props.settings.particleTtlRange[0] = min
            props.settings.particleTtlRange[1] = max
            forceUpdate()
          }}
        />
      </Foldable>
    </div>
  )
}
