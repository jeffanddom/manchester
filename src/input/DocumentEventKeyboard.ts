/**
 * TODO: we should consume DOM events using a queue, and apply the queued events
 * to internal state on a frame-by-frame basis.
 */

import { IKeyboard } from '~/input/interfaces'

export class DocumentEventKeyboard implements IKeyboard {
  downKeys: Set<string>
  upKeys: Set<string>

  constructor(document: Document) {
    this.downKeys = new Set()
    this.upKeys = new Set()

    document.addEventListener('focusout', () => {
      this.downKeys.clear()
      this.upKeys.clear()
    })
    document.addEventListener('keydown', (event) => {
      this.downKeys.add(event.code)
      this.upKeys.delete(event.code)
    })
    document.addEventListener('keyup', (event) => {
      this.downKeys.delete(event.code)
      this.upKeys.add(event.code)
    })
  }

  update(): void {
    this.upKeys.clear()
  }
}
