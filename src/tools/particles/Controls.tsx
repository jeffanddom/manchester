import * as React from 'react'

import { Config } from '~/tools/particles/interfaces'

interface ConfigWithBit extends Config {
  dirty: boolean
}

export const Controls = (props: {
  initialConfig: Config
  updateGlobalConfig: (c: Config) => void
}) => {
  const [config, setConfig] = React.useState<ConfigWithBit>({
    ...props.initialConfig,
    dirty: false,
  })

  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value, dirty: true })
  }

  const publishConfig = () => {
    props.updateGlobalConfig(config)
    setConfig({ ...config, dirty: false })
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
        <label htmlFor="orientation">Particle lifespan</label>
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

      <button
        type="submit"
        disabled={!config.dirty}
        style={{
          fontSize: 16,
          border: 'none',
          borderRadius: 5,
          padding: '8px 20px',
          ...(config.dirty
            ? {
                backgroundColor: '#28a745',
                color: 'white',
              }
            : {
                backgroundColor: '#ccc',
                color: '#888',
              }),
        }}
        onClick={publishConfig}
      >
        Apply
      </button>
    </div>
  )
}
