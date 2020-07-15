import { vec2 } from 'gl-matrix'

export class Destination {
  pos: vec2
  path: vec2[]

  constructor(pos: vec2, path: vec2[]) {
    this.pos = pos
    this.path = path
  }
}
