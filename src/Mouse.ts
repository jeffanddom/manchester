import { vec2 } from 'gl-matrix'

export class Mouse {
  private pos: vec2

  constructor() {
    this.pos = vec2.create()

    document.addEventListener('mousemove', (event) => {
      this.pos = vec2.fromValues(event.clientX, event.clientY)
    })
  }

  getPos(): vec2 {
    return vec2.clone(this.pos)
  }
}
