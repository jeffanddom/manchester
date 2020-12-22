import { vec2 } from 'gl-matrix'

import { IMouse, MouseButton, mouseButtonFromRaw } from './interfaces'

export class DocumentEventMouse implements IMouse {
  private pos: vec2 | undefined
  private down: Set<MouseButton>
  private up: Set<MouseButton>

  constructor(document: Document) {
    this.pos = undefined
    this.down = new Set()
    this.up = new Set()

    document.addEventListener('mousemove', (event) => {
      this.pos = vec2.fromValues(event.offsetX, event.offsetY)
    })

    document.addEventListener('mousedown', (event) => {
      const b = mouseButtonFromRaw(event.button)
      if (b !== undefined) {
        this.down.add(b)
      }
    })

    document.addEventListener('mouseup', (event) => {
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
    document.addEventListener('mouseout', (_event) => {
      this.pos = undefined
      this.down = new Set()
    })

    document.addEventListener('focusout', () => {
      this.pos = undefined
      this.down = new Set()
    })
  }

  getPos(): vec2 | undefined {
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
