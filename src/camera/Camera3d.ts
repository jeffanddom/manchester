import { mat4, quat, vec2, vec3 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'
import * as math from '~/util/math'

export class Camera3d {
  private pos: vec3
  private orientation: quat
  private viewportDimensions: vec2
  private fov: number

  constructor(params: { viewportDimensions: Immutable<vec2> }) {
    this.pos = vec3.create()
    this.orientation = quat.create()
    this.viewportDimensions = vec2.clone(params.viewportDimensions)
    this.fov = (75 * Math.PI) / 180
  }

  getPos(): Immutable<vec3> {
    return this.pos
  }

  getOrientation(): Immutable<quat> {
    return this.orientation
  }

  getWvTransform(): mat4 {
    const res = mat4.create()
    return mat4.invert(
      res,
      mat4.fromRotationTranslation(res, this.orientation, this.pos),
    )
  }

  getViewportDimensions(): Immutable<vec2> {
    return this.viewportDimensions
  }

  // TODO: Connect this with Renderer3d#fov
  getFov(): number {
    return this.fov
  }

  screenToWorld(screenPos: Immutable<vec2>): vec3 {
    return vec3.transformMat4(
      vec3.create(),
      math.screenToView(
        screenPos,
        this.viewportDimensions,
        math.fovToFocalLength(this.fov),
      ),
      mat4.invert(mat4.create(), this.getWvTransform()),
    )
  }

  setPos(v: Immutable<vec3>): void {
    this.pos = vec3.clone(v)
  }

  setOrientation(q: Immutable<quat>): void {
    this.orientation = quat.clone(q)
  }

  setViewportDimensions(v: vec2): void {
    vec2.copy(this.viewportDimensions, v)
  }
}
