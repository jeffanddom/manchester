export function valueToStep(
  value: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = Math.round((value - config.min) / stepSize)
  return res
}

export function stepToValue(
  step: number,
  config: { min: number; max: number; steps: number },
): number {
  const stepSize = (config.max - config.min) / config.steps
  const res = config.min + step * stepSize
  return res
}
