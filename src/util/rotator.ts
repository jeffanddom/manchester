const normalizeAngle = (theta: number): number => {
  if (theta > Math.PI) {
    return theta - 2 * Math.PI
  } else if (theta < -Math.PI) {
    return theta + 2 * Math.PI
  }
  return theta
}

export const rotate = (params: {
  from: number
  to: number
  amount: number
}): number => {
  const { from, to, amount } = params
  const diff = normalizeAngle(to - from)

  return normalizeAngle(
    from + (amount >= Math.abs(diff) ? diff : Math.sign(diff) * amount),
  )
}
