export function webcolorToFloatRgb(s: string): [number, number, number] {
  if (s.match(/^#?[0-9a-fA-F]{6}$/) === null) {
    throw `invalid webcolor: ${s}`
  }

  if (s.startsWith('#')) {
    s = s.slice(1)
  }

  const r = parseInt(s.slice(0, 2), 16) / 255
  const g = parseInt(s.slice(2, 4), 16) / 255
  const b = parseInt(s.slice(4, 6), 16) / 255

  return [r, g, b]
}

export function floatRgbToWebcolor(rgb: ArrayLike<number>): string {
  if (rgb.length !== 3) {
    throw `invalid rgb triplet ${rgb}`
  }

  let res = '#'
  for (let i = 0; i < 3; i++) {
    const v = rgb[i]
    if (v < 0 || 1 < v) {
      throw `rgb value out of range in ${rgb}`
    }

    const s = Math.round(v * 255).toString(16)
    res += s.length === 2 ? s : '0' + s
  }

  return res
}
