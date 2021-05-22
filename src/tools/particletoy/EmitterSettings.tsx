import { vec3 } from 'gl-matrix'
import React, { ReactElement, useState } from 'react'
import 'rc-slider/assets/index.css'

import { GradientPicker } from './GradientPicker'
import { ScaledRange } from './ScaledRange'
import { ScaledSlider } from './ScaledSlider'
import { rightPaneContainerStyle } from './util'

import { BasicEmitterSettings } from '~/engine/particles/emitters/BasicEmitter'
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

function Label(props: {
  text: string
  value: number | [number, number]
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
      }}
    >
      <span>{props.text}</span>
      <span>
        {Array.isArray(props.value)
          ? props.value.map((n) => n.toFixed(2)).join('-')
          : props.value.toFixed(2)}
      </span>
    </div>
  )
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

      <Foldable title="Timing">
        <Label text="Emitter TTL" value={props.settings.emitterTtl} />
        <ScaledSlider
          exponential
          min={0}
          max={10}
          steps={100}
          value={props.settings.emitterTtl}
          onChange={(v) => {
            props.settings.emitterTtl = v
            props.settings.startOffset = Math.min(props.settings.startOffset, v)
            forceUpdate()
          }}
        />
        <Label text="Start offset" value={props.settings.startOffset} />
        <ScaledSlider
          min={0}
          max={10}
          steps={100}
          value={props.settings.startOffset}
          onChange={(v) => {
            props.settings.startOffset = v
            props.settings.emitterTtl = Math.max(props.settings.emitterTtl, v)
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Spawn rate">
        <Label text="Particles per second" value={props.settings.spawnRate} />
        <ScaledSlider
          exponential
          min={0}
          max={2000}
          steps={100}
          value={props.settings.spawnRate}
          onChange={(v) => {
            props.settings.spawnRate = v
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Scale">
        <Label
          text="Width"
          value={[
            props.settings.scaleRange[0][0],
            props.settings.scaleRange[1][0],
          ]}
        />
        <ScaledRange
          exponential
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
        <Label
          text="Width"
          value={[
            props.settings.scaleRange[0][1],
            props.settings.scaleRange[1][1],
          ]}
        />
        <ScaledRange
          exponential
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
        <Label
          text="Alpha"
          value={[props.settings.alphaRange[0], props.settings.alphaRange[1]]}
        />
        <ScaledRange
          min={0}
          max={1}
          steps={100}
          draggableTrack
          pushable
          value={[props.settings.alphaRange[0], props.settings.alphaRange[1]]}
          onChange={([min, max]) => {
            props.settings.alphaRange[0] = min
            props.settings.alphaRange[1] = max
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Spread">
        <Label
          text="Spread X"
          value={[
            props.settings.spreadXRange[0],
            props.settings.spreadXRange[1],
          ]}
        />
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
        <Label
          text="Spread Y"
          value={[
            props.settings.spreadYRange[0],
            props.settings.spreadYRange[1],
          ]}
        />
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

      <Foldable title="Position offset">
        <Label
          text="X"
          value={[
            props.settings.translationOffsetRange[0][0],
            props.settings.translationOffsetRange[1][0],
          ]}
        />
        <ScaledRange
          min={-10}
          max={10}
          steps={100}
          draggableTrack
          pushable
          marks={{
            50: { label: '0', style: { color: 'white' } },
          }}
          value={[
            props.settings.translationOffsetRange[0][0],
            props.settings.translationOffsetRange[1][0],
          ]}
          onChange={([min, max]) => {
            props.settings.translationOffsetRange[0][0] = min
            props.settings.translationOffsetRange[1][0] = max
            forceUpdate()
          }}
        />
        <Label
          text="Y"
          value={[
            props.settings.translationOffsetRange[0][1],
            props.settings.translationOffsetRange[1][1],
          ]}
        />
        <ScaledRange
          min={-10}
          max={10}
          steps={100}
          draggableTrack
          pushable
          marks={{
            50: { label: '0', style: { color: 'white' } },
          }}
          value={[
            props.settings.translationOffsetRange[0][1],
            props.settings.translationOffsetRange[1][1],
          ]}
          onChange={([min, max]) => {
            props.settings.translationOffsetRange[0][1] = min
            props.settings.translationOffsetRange[1][1] = max
            forceUpdate()
          }}
        />
        <Label
          text="Z"
          value={[
            props.settings.translationOffsetRange[0][2],
            props.settings.translationOffsetRange[1][2],
          ]}
        />
        <ScaledRange
          min={-10}
          max={10}
          steps={100}
          draggableTrack
          pushable
          marks={{
            50: { label: '0', style: { color: 'white' } },
          }}
          value={[
            props.settings.translationOffsetRange[0][2],
            props.settings.translationOffsetRange[1][2],
          ]}
          onChange={([min, max]) => {
            props.settings.translationOffsetRange[0][2] = min
            props.settings.translationOffsetRange[1][2] = max
            forceUpdate()
          }}
        />
      </Foldable>

      <Foldable title="Speed">
        <Label
          text="Tiles per second"
          value={[props.settings.speedRange[0], props.settings.speedRange[1]]}
        />
        <ScaledRange
          exponential
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
        <Label
          text="Seconds"
          value={[
            props.settings.particleTtlRange[0],
            props.settings.particleTtlRange[1],
          ]}
        />
        <ScaledRange
          exponential
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

      <Foldable title="Gravity">
        <Label text="Tiles/second/second" value={props.settings.gravity[1]} />
        <ScaledSlider
          min={-25}
          max={25}
          steps={100}
          value={props.settings.gravity[1]}
          onChange={(v) => {
            props.settings.gravity = vec3.fromValues(0, v, 0)
            forceUpdate()
          }}
        />
      </Foldable>
    </div>
  )
}
