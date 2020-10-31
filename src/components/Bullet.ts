import { vec2 } from 'gl-matrix'

const BULLET_RANGE = 360

export class Bullet {
  origin: vec2
  range = BULLET_RANGE

  constructor(origin: vec2) {
    this.origin = origin
  }
}
