import * as React from 'react'

import { Config } from '~/tools/particles/interfaces'

export const Controls = (props: {
  initialConfig: Config
  updateGlobalConfig: (c: Config) => void
}) => {
  const [config, setConfig] = React.useState(props.initialConfig)

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    props.updateGlobalConfig(newConfig)
  }

  const parse = (val: string) => {
    if (val === '') return ''
    return parseFloat(val)
  }

  return (
    <div style={{ margin: 'auto', width: 300 }}>
      <div>
        <label htmlFor="backgroundColor">Background Color</label>
        <input
          type="text"
          name="backgroundColor"
          value={config.backgroundColor}
          onChange={(e) => {
            updateConfig('backgroundColor', e.target.value)
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="emitterLifespan">Emitter lifespan</label>
        <input
          type="number"
          name="emitterLifespan"
          value={config.emitterLifespan}
          onChange={(e) => {
            updateConfig('emitterLifespan', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="particleLifespan">Particle lifespan</label>
        <input
          type="number"
          name="particleLifespan"
          value={config.particleLifespan}
          onChange={(e) => {
            updateConfig('particleLifespan', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="orientation">Orientation</label>
        <input
          type="range"
          name="orientation"
          min="0"
          max={Math.PI * 2}
          step="0.1"
          value={config.orientation}
          onChange={(e) => {
            updateConfig('orientation', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="arc">Arc</label>
        <input
          type="range"
          name="arc"
          min="0"
          max={Math.PI * 2}
          step="0.1"
          value={config.arc}
          onChange={(e) => {
            updateConfig('arc', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="particleRate">Particle rate/frame</label>
        <input
          type="number"
          name="particleRate"
          value={config.particleRate}
          onChange={(e) => {
            updateConfig('particleRate', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="particleRadius">Max particle radius</label>
        <input
          type="number"
          name="particleRadius"
          value={config.particleRadius}
          onChange={(e) => {
            updateConfig('particleRadius', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="particleSpeedMin">Particle speed min</label>
        <input
          type="number"
          name="particleSpeedMin"
          value={config.particleSpeedMin}
          onChange={(e) => {
            updateConfig('particleSpeedMin', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="particleSpeedMax">Particle speed max</label>
        <input
          type="number"
          name="particleSpeedMax"
          value={config.particleSpeedMax}
          onChange={(e) => {
            updateConfig('particleSpeedMax', parse(e.target.value))
          }}
        ></input>
      </div>

      <div>
        <label htmlFor="colors">Colors (comma-separated hex)</label>
        <input
          type="text"
          name="colors"
          value={config.colors}
          onChange={(e) => {
            updateConfig('colors', e.target.value.split(','))
          }}
        ></input>
      </div>
    </div>
  )
}
