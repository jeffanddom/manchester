import { vec2 } from 'gl-matrix'

export class Transform {
  previousPosition: vec2
  position: vec2
  orientation: number

  constructor() {
    this.previousPosition = vec2.create()
    this.position = vec2.create()
    this.orientation = 0
  }

  update() {
    this.previousPosition = vec2.copy(vec2.create(), this.position)
  }
}
