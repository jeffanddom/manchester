import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { StackAllocator } from './StackAllocator'

export { StackAllocator } from '~/util/stackAllocator/StackAllocator'

export class Mat4Allocator extends StackAllocator<mat4> {
  constructor(size: number) {
    super(size, mat4.create, mat4.identity)
  }
}

export class QuatAllocator extends StackAllocator<quat> {
  constructor(size: number) {
    super(size, quat.create, quat.identity)
  }
}

export class Vec2Allocator extends StackAllocator<vec2> {
  constructor(size: number) {
    super(size, vec2.create, vec2.zero)
  }
}

export class Vec3Allocator extends StackAllocator<vec3> {
  constructor(size: number) {
    super(size, vec3.create, vec3.zero)
  }
}

export class Vec4Allocator extends StackAllocator<vec4> {
  constructor(size: number) {
    super(size, vec4.create, vec4.zero)
  }
}
