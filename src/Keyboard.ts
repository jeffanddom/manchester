/**
 * TODO: we should consume DOM events using a queue, and apply the queued events
 * to internal state on a frame-by-frame basis.
 */

import { keyMap } from '~/systems/client/playerInput'

export interface IKeyboard {
  downKeys: Set<number>
  upKeys: Set<number>
  update: () => void
}

export class Keyboard implements IKeyboard {
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

export class SimulatedKeyboard implements IKeyboard {
  downKeys: Set<number>
  upKeys: Set<number>
  frameCount: number

  constructor() {
    this.frameCount = 0
    this.downKeys = new Set()
    this.upKeys = new Set()
  }

  update(): void {
    this.frameCount++

    this.downKeys = new Set(
      Math.floor(this.frameCount / 60) % 2 === 1
        ? [keyMap.moveLeft]
        : [keyMap.moveRight],
    )
  }
}
