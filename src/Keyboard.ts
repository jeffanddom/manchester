/**
 * TODO: we should consume DOM events using a queue, and apply the queued events
 * to internal state on a frame-by-frame basis.
 */

export class Keyboard {
  downKeys: Set<number>
  upKeys: Set<number>

  constructor() {
    this.downKeys = new Set()
    this.upKeys = new Set()

    document.addEventListener('focusout', () => {
      this.downKeys.clear()
      this.upKeys.clear()
    })
    document.addEventListener('keydown', (event) => {
      this.downKeys.add(event.which)
      this.upKeys.delete(event.which)
    })
    document.addEventListener('keyup', (event) => {
      this.downKeys.delete(event.which)
      this.upKeys.add(event.which)
    })
  }

  update(): void {
    this.upKeys.clear()
  }
}
