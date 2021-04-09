import Slider, { SliderProps } from 'rc-slider'
import React, { ReactElement } from 'react'

import { stepToValue, valueToStep } from './util'

export function ScaledSlider(
  props: {
    min: number
    max: number
    steps: number
    value: number
    exponential?: boolean
    onChange: (value: number) => void
  } & SliderProps,
): ReactElement {
  return (
    <Slider
      {...props}
      min={0}
      max={props.steps}
      step={1}
      value={valueToStep(props.value, props)}
      onChange={(stepValue) => props.onChange(stepToValue(stepValue, props))}
    ></Slider>
  )
}
