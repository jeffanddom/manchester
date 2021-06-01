import { mat4, vec2, vec3 } from 'gl-matrix'

import { CAMERA_DEFAULT_FOV } from '~/game/constants'
import { Immutable } from '~/types/immutable'
import * as math from '~/util/math'

export class Camera3d {
  private pos: vec3
  private viewportDimensions: vec2
  private fov: number
  private target: vec3

  constructor(params: { viewportDimensions: Immutable<vec2> }) {
    this.pos = vec3.create()
    this.viewportDimensions = vec2.clone(params.viewportDimensions)
    this.fov = CAMERA_DEFAULT_FOV
    this.target = vec3.create()
  }

  getPos(): Immutable<vec3> {
    return this.pos
  }

  getTarget(out: vec3): vec3 {
    return vec3.copy(out, this.target)
  }

  getWvTransform(out: mat4): mat4 {
    const res = mat4.invert(out, this.targetTo(out))
    if (res === null) {
      throw `cannot invert targetTo matrix`
    }
    return out
  }

  getViewportDimensions(): Immutable<vec2> {
    return this.viewportDimensions
  }

  getFov(): number {
    return this.fov
  }

  screenToWorld(out: vec3, screenPos: Immutable<vec2>): vec3 {
    return vec3.transformMat4(
      out,
      math.screenToView(
        out,
        screenPos,
        this.viewportDimensions,
        math.fovToFocalLength(this.fov),
      ),
      this.targetTo(mat4.create()),
    )
  }

  private targetTo(out: mat4): mat4 {
    return mat4.targetTo(out, this.pos, this.target, math.PlusY3)
  }

  setPos(v: Immutable<vec3>): void {
    this.pos = vec3.clone(v)
  }

  setTarget(pos: Immutable<vec3>): void {
    vec3.copy(this.target, pos)
  }

  setViewportDimensions(v: vec2): void {
    vec2.copy(this.viewportDimensions, v)
  }

  setFov(fov: number): void {
    this.fov = fov
  }
}
