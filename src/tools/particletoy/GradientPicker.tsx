import * as React from 'react'

export function GradientPicker(props: {
  min: string // hex color string
  max: string // hex color string
  onChange: (min: string, max: string) => void
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <input
        type="color"
        value={props.min}
        onChange={(event) => props.onChange(event.target.value, props.max)}
        style={{
          padding: 0,
          border: 0,
        }}
      ></input>
      <div
        style={{
          background: `linear-gradient(to right, ${props.min}, ${props.max})`,
          flexGrow: 4,
        }}
      ></div>
      <input
        type="color"
        value={props.max}
        onChange={(event) => props.onChange(props.min, event.target.value)}
        style={{
          padding: 0,
          border: 0,
        }}
      ></input>
    </div>
  )
}
