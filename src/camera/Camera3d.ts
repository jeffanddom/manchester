import { mat4 } from 'gl-matrix'
import { quat, vec3 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export class Camera3d {
  private pos: vec3
  private orientation: quat

  constructor() {
    this.pos = vec3.create()
    this.orientation = quat.create()
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

  setPos(v: Immutable<vec3>): void {
    this.pos = vec3.clone(v)
  }

  setOrientation(q: Immutable<quat>): void {
    this.orientation = quat.clone(q)
  }
}
