import { Range } from 'rc-slider'
import React, { ReactElement } from 'react'

function valueToStep(
  value: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = Math.round((value - config.min) / stepSize)
  return res
}

function stepToValue(
  step: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = config.min + step * stepSize
  return res
}

export function ScaledRange(props: {
  min: number
  max: number
  steps: number
  value: number[]
  onChange: (values: number[]) => void
}): ReactElement {
  return (
    <Range
      min={0}
      max={props.steps}
      step={1}
      value={props.value.map((v) => valueToStep(v, props))}
      onChange={(stepValues) =>
        props.onChange(stepValues.map((sv) => stepToValue(sv, props)))
      }
    ></Range>
  )
}
