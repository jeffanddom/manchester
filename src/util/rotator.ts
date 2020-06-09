import { vec2 } from 'gl-matrix'

import { TransformData } from '~/interfaces'
import { getAngle } from '~/util/math'

const normalizeAngle = (theta: number): number => {
  if (theta > Math.PI) {
    return theta - 2 * Math.PI
  } else if (theta < -Math.PI) {
    return theta + 2 * Math.PI
  }
  return theta
}

const getAngularDistance = (params: {
  from: TransformData
  to: vec2 | number
}): number => {
  const { from, to } = params
  const targetOrientation =
    typeof to === 'number' ? to : getAngle(from.position, to)
  return normalizeAngle(targetOrientation - from.orientation)
}

export const rotate = (params: {
  from: TransformData
  to: vec2 | number
  speed: number
  dt: number
}): number => {
  const { from, to, dt } = params
  const diff = getAngularDistance({ from, to })
  const disp = dt * params.speed

  let newOrientation =
    from.orientation + (disp >= Math.abs(diff) ? diff : Math.sign(diff) * disp)
  newOrientation = normalizeAngle(newOrientation)
  return newOrientation
}
