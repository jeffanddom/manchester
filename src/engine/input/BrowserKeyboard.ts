/**
 * TODO: we should consume DOM events using a queue, and apply the queued events
 * to internal state on a frame-by-frame basis.
 */

import { IKeyboard } from '~/engine/input/interfaces'

export class BrowserKeyboard implements IKeyboard {
  downKeys: Set<string>
  heldkeys: Set<string>
  upKeys: Set<string>

  constructor(document: Document) {
    this.downKeys = new Set()
    this.heldkeys = new Set()
    this.upKeys = new Set()

    document.addEventListener('focusout', () => {
      this.heldkeys.clear()
      this.upKeys.clear()
    })
    document.addEventListener('keydown', (event) => {
      this.downKeys.add(event.code)
      this.heldkeys.add(event.code)
      this.upKeys.delete(event.code)
    })
    document.addEventListener('keyup', (event) => {
      this.heldkeys.delete(event.code)
      this.upKeys.add(event.code)
    })
  }

  reset(): void {
    this.heldkeys = new Set()
    this.upKeys = new Set()
  }

  update(): void {
    this.downKeys.clear()
    this.upKeys.clear()
  }
}
