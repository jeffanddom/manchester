import { vec3 } from 'gl-matrix'

export class CameraController {
  private target: vec3
  private pos: vec3
  private vel: vec3

  constructor() {
    this.target = vec3.create()
    this.pos = vec3.create()
    this.vel = vec3.create()
  }

  public reset(pos: vec3): void {
    vec3.copy(this.target, pos)
    vec3.copy(this.pos, pos)
    vec3.zero(this.vel)
  }

  public setTarget(v: vec3): void {
    vec3.copy(this.target, v)
  }

  // v1 = v0 + a0 * dt
  // p1 = p0 + v1 * dt
  public update(dt: number): void {
    const k = 20
    const c = -10

    // a = k * (t - p) + c * v0
    const acc = vec3.create()
    vec3.add(
      acc,
      vec3.scale(
        vec3.create(),
        vec3.sub(vec3.create(), this.target, this.pos),
        k,
      ),
      vec3.scale(vec3.create(), this.vel, c),
    )

    vec3.add(this.vel, this.vel, vec3.scale(vec3.create(), acc, dt)) // v1 = v0 + a * dt
    vec3.add(this.pos, this.pos, vec3.scale(vec3.create(), this.vel, dt)) // p1 = p0 + v1 * dt
  }

  public getPos(out: vec3): void {
    vec3.copy(out, this.pos)
  }
}
