import { Range, RangeProps } from 'rc-slider'
import React, { ReactElement } from 'react'

import { stepToValue, valueToStep } from './util'

export function ScaledRange(
  props: {
    logarithmic?: boolean
    min: number
    max: number
    steps: number
    value: number[]
    onChange: (values: number[]) => void
  } & RangeProps,
): ReactElement {
  const { steps, value, onChange } = props

  if (props.marks !== undefined) {
    props.style = { ...props.style, ...{ marginBottom: 30 } }
  }

  return (
    <Range
      {...props}
      min={0}
      max={steps}
      step={1}
      value={value.map((v) => valueToStep(v, props))}
      onChange={(stepValues) =>
        onChange(stepValues.map((sv) => stepToValue(sv, props)))
      }
    ></Range>
  )
}
