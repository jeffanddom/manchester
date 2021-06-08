import { vec2 } from 'gl-matrix'

export enum DirectionMove {
  N = 0,
  NE = Math.PI / 4,
  E = Math.PI / 2,
  SE = Math.PI - Math.PI / 4,
  S = Math.PI,
  SW = -Math.PI + Math.PI / 4,
  W = -Math.PI / 2,
  NW = -Math.PI / 4,
}

export interface IKeyboard {
  downKeys: Set<string>
  heldkeys: Set<string>
  upKeys: Set<string>

  reset: () => void
  update: () => void
}

export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
}

/**
 * Events such as pointerdown and pointerup provide the "buttons" bitmask.
 */
export function mouseButtonsFromBitmask(buttons: number): Set<MouseButton> {
  const res = new Set<MouseButton>()

  if ((buttons & 1) !== 0) {
    res.add(MouseButton.Left)
  }

  if ((buttons & 2) !== 0) {
    res.add(MouseButton.Right)
  }

  if ((buttons & 4) !== 0) {
    res.add(MouseButton.Middle)
  }

  return res
}

export function mouseButtonFromRaw(raw: number): MouseButton | undefined {
  if (!(raw in MouseButton)) {
    return undefined
  }
  return <MouseButton>raw
}

export interface IMouse {
  getPos: () => vec2 | undefined
  isDown: (b: MouseButton) => boolean
  isHeld: (b: MouseButton) => boolean
  isUp: (b: MouseButton) => boolean
  getScroll: () => number
  reset: () => void
  update: () => void
}
