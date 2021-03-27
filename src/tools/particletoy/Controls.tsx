import { vec3 } from 'gl-matrix'
import React, { ReactElement, useState } from 'react'

import { BasicEmitter } from '~/particles/emitters/BasicEmitter'

interface SliderProps {
  min?: number
  max?: number
  step?: number
  initialValue?: number
  onChange: (v: number) => void
}

function Slider(props: SliderProps): ReactElement {
  const [value, setValue] = useState(props.initialValue ?? 0)
  return (
    <input
      type="range"
      min={props.min ?? -5}
      max={props.max ?? 5}
      step={props.step ?? 0.1}
      value={value}
      onChange={(event) => {
        const newValue = parseFloat(event.target.value)
        setValue(newValue)
        props.onChange(newValue)
      }}
    ></input>
  )
}

function SliderTable(props: {
  items: Record<string, SliderProps>
}): ReactElement {
  return (
    <table>
      <tbody>
        {Object.keys(props.items).map((k) => {
          return (
            <tr key={k}>
              <td>{k}</td>
              <td>
                <Slider {...props.items[k]}></Slider>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Foldable(
  props: React.PropsWithChildren<{
    title: string
    initialOpen?: boolean
  }>,
): ReactElement {
  const [open, setOpen] = useState(props.initialOpen ?? false)
  return (
    <div>
      <span onClick={() => setOpen(!open)}>
        {open ? '-' : '+'} {props.title}
      </span>
      {open ? <div>{props.children}</div> : null}
    </div>
  )
}

function vec3SliderTableItems(
  vecRef: vec3,
  labels: [string, string, string],
): Record<string, SliderProps> {
  return {
    [labels[0]]: {
      onChange: (v) => (vecRef[0] = v),
    },
    [labels[1]]: {
      onChange: (v) => (vecRef[1] = v),
    },
    [labels[2]]: {
      onChange: (v) => (vecRef[2] = v),
    },
  }
}

export const Controls = (props: { emitter: BasicEmitter }): ReactElement => {
  return (
    <table>
      <tbody>
        <tr>
          <td>Spawn rate</td>
          <td>
            <Slider
              min={0}
              max={1000}
              initialValue={props.emitter.getMutableConfig().spawnRate}
              onChange={(v) => {
                props.emitter.getMutableConfig().spawnRate = v
              }}
            ></Slider>{' '}
          </td>
        </tr>

        <tr>
          <td colSpan={2}>
            <Foldable title="Origin">
              <SliderTable
                items={vec3SliderTableItems(
                  props.emitter.getMutableConfig().origin,
                  ['X', 'Y', 'Z'],
                )}
              ></SliderTable>
            </Foldable>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
