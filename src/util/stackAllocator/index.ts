import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { StackAllocator } from './StackAllocator'

export { StackAllocator } from '~/util/stackAllocator/StackAllocator'

const sentinel = 6969699.696969

function fillMat4(obj: mat4): void {
  obj[0] = sentinel
  obj[1] = sentinel
  obj[2] = sentinel
  obj[3] = sentinel
  obj[4] = sentinel
  obj[5] = sentinel
  obj[6] = sentinel
  obj[7] = sentinel
  obj[8] = sentinel
  obj[9] = sentinel
  obj[10] = sentinel
  obj[11] = sentinel
  obj[12] = sentinel
  obj[13] = sentinel
  obj[14] = sentinel
  obj[15] = sentinel
}

function fillQuat(obj: quat): void {
  obj[0] = sentinel
  obj[1] = sentinel
  obj[2] = sentinel
  obj[3] = sentinel
}

function fillVec2(obj: vec2): void {
  obj[0] = sentinel
  obj[1] = sentinel
}

function fillVec3(obj: vec3): void {
  obj[0] = sentinel
  obj[1] = sentinel
  obj[2] = sentinel
}

function fillVec4(obj: vec4): void {
  obj[0] = sentinel
  obj[1] = sentinel
  obj[2] = sentinel
  obj[3] = sentinel
}

export class Mat4Allocator extends StackAllocator<mat4> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: mat4.create,
      setDefault: mat4.identity,
      setFree: opts.debug ? fillMat4 : undefined,
    })
  }
}

export class QuatAllocator extends StackAllocator<quat> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: quat.create,
      setDefault: quat.identity,
      setFree: opts.debug ? fillQuat : undefined,
    })
  }
}

export class Vec2Allocator extends StackAllocator<vec2> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: vec2.create,
      setDefault: vec2.zero,
      setFree: opts.debug ? fillVec2 : undefined,
    })
  }
}

export class Vec3Allocator extends StackAllocator<vec3> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: vec3.create,
      setDefault: vec3.zero,
      setFree: opts.debug ? fillVec3 : undefined,
    })
  }
}

export class Vec4Allocator extends StackAllocator<vec4> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: vec4.create,
      setDefault: vec4.zero,
      setFree: opts.debug ? fillVec4 : undefined,
    })
  }
}
