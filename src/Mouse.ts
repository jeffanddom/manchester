import { vec2 } from 'gl-matrix'

import { None, Option, Some } from '~/util/Option'

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
  private up: Set<MouseButton>

  constructor(element: HTMLElement) {
    this.pos = None()
    this.down = new Set()
    this.up = new Set()

    element.addEventListener('mousemove', (event) => {
      this.pos = Some(vec2.fromValues(event.offsetX, event.offsetY))
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
        if (this.down.has(b)) {
          this.up.add(b)
          this.down.delete(b)
        }
      }
    })

    // clear state if the mouse leaves the root element, or if the window loses
    // focus
    element.addEventListener('mouseout', (_event) => {
      this.pos = None()
      this.down = new Set()
    })

    document.addEventListener('focusout', () => {
      this.pos = None()
      this.down = new Set()
    })
  }

  getPos(): Option<vec2> {
    return this.pos
  }

  isDown(b: MouseButton): boolean {
    return this.down.has(b)
  }

  isUp(b: MouseButton): boolean {
    return this.up.has(b)
  }

  update(): void {
    this.up.clear()
  }
}
