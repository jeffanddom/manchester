import { vec2 } from 'gl-matrix'

const BULLET_RANGE = 360

export class Bullet {
  origin: vec2
  range: number

  constructor(origin: vec2) {
    this.origin = origin
    this.range = BULLET_RANGE
  }

  clone(): Bullet {
    const c = new Bullet(vec2.clone(this.origin))
    c.range = this.range
    return c
  }
}
