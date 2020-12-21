import { vec2 } from 'gl-matrix'

export enum DirectionMove {
  N = 0,
  NE = -Math.PI / 4,
  E = -Math.PI / 2,
  SE = Math.PI + Math.PI / 4,
  S = Math.PI,
  SW = Math.PI - Math.PI / 4,
  W = Math.PI / 2,
  NW = Math.PI / 4,
}

export interface IKeyboard {
  downKeys: Set<number>
  upKeys: Set<number>
  update: () => void
}

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

export function mouseButtonFromRaw(raw: number): MouseButton | undefined {
  if (MouseButton[raw] === undefined) {
    return undefined
  }
  return <MouseButton>raw
}

export interface IMouse {
  getPos: () => vec2 | null
  isDown: (b: MouseButton) => boolean
  isUp: (b: MouseButton) => boolean
  update: () => void
}
