import { IKeyboard } from '~/interfaces'

export class Keyboard implements IKeyboard {
  downKeys: Set<number>

  constructor() {
    this.downKeys = new Set()
    document.addEventListener('focusout', () => {
      this.downKeys.clear()
    })
    document.addEventListener('keydown', (event) => {
      this.downKeys.add(event.which)
    })
    document.addEventListener('keyup', (event) => {
      this.downKeys.delete(event.which)
    })
  }
}
