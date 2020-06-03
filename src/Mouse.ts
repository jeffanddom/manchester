import { vec2 } from 'gl-matrix'

import { Option } from '~util/Option'

export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

function mouseButtonFromRaw(raw: number): MouseButton | undefined {
  if (MouseButton[raw] === undefined) {
    return undefined
  }
  return <MouseButton>raw
}

export class Mouse {
  private pos: Option<vec2>
  private down: Set<MouseButton>

  constructor(element: HTMLElement) {
    this.pos = Option.none()
    this.down = new Set()

    element.addEventListener('mousemove', (event) => {
      this.pos = Option.some(vec2.fromValues(event.offsetX, event.offsetY))
    })

    element.addEventListener('mousedown', (event) => {
      const b = mouseButtonFromRaw(event.button)
      if (b !== undefined) {
        this.down.add(b)
      }
    })

    element.addEventListener('mouseup', (event) => {
      const b = mouseButtonFromRaw(event.button)
      if (b !== undefined) {
        this.down.delete(b)
      }
    })

    // clear state if the mouse leaves the root element, or if the window loses
    // focus
    element.addEventListener('mouseout', (_event) => {
      this.pos = Option.none()
      this.down = new Set()
    })

    document.addEventListener('focusout', () => {
      this.pos = Option.none()
      this.down = new Set()
    })
  }

  getPos(): Option<vec2> {
    return this.pos
  }

  isDown(b: MouseButton): boolean {
    return this.down.has(b)
  }
}
