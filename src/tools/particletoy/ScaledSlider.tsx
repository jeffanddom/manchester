import Slider from 'rc-slider'
import React, { ReactElement } from 'react'

import { stepToValue, valueToStep } from './util'

export function ScaledSlider(props: {
  min: number
  max: number
  steps: number
  value: number
  onChange: (value: number) => void
}): ReactElement {
  return (
    <Slider
      min={0}
      max={props.steps}
      step={1}
      value={valueToStep(props.value, props)}
      onChange={(stepValue) => props.onChange(stepToValue(stepValue, props))}
    ></Slider>
  )
}
