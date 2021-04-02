/**
 * A typing monkey patch for glMatrix, replacing ReadonlyXYZ with Immutable<XYZ>.
 */

import { Immutable } from '../immutable'

declare module 'gl-matrix' {
  export namespace mat2d {
    export function fromTranslation(out: mat2d, v: Immutable<vec2>): mat2d
  }

  export namespace mat4 {
    export function fromRotation(out: mat4, rad: number, axis: Immutable<vec3>)

    export function multiply(
      out: mat4,
      a: Immutable<mat4>,
      b: Immutable<mat4>,
    ): mat4

    // TODO: glMatrix type annotations are not strict. invert() will return null
    // if the determinant is zero, i.e., if the matrix is not invertible.
    // export function invert(out: mat4, input: mat4): mat4 | null

    export function targetTo(
      out: mat4,
      eye: Immutable<vec3>,
      target: Immutable<vec3>,
      up: Immutable<vec3>,
    )
  }

  export namespace vec2 {
    export function add(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function angle(a: Immutable<vec2>, b: Immutable<vec2>): number
    export function clone(a: Immutable<vec2>): vec2
    export function copy(out: vec2, a: Immutable<vec2>): vec2
    export function distance(a: Immutable<vec2>, b: Immutable<vec2>): number
    export function equals(a: Immutable<vec2>, b: Immutable<vec2>): boolean
    export function max(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function min(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function normalize(out: vec2, a: Immutable<vec2>): vec2
    export function rotate(
      out: vec2,
      v: Immutable<vec2>,
      origin: Immutable<vec2>,
      radians: number,
    )
    export function scale(out: vec2, a: Immutable<vec2>, b: number): vec2
    export function squaredDistance(
      a: Immutable<vec2>,
      b: Immutable<vec2>,
    ): number
    export function squaredLength(a: Immutable<vec2>): number
    export function sub(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function subtract(
      out: vec2,
      a: Immutable<vec2>,
      b: Immutable<vec2>,
    ): vec2
  }

  export namespace vec3 {
    export function clone(a: Immutable<vec3>): vec3
    export function copy(out: vec3, src: Immutable<vec3>): vec3
    export function cross(
      out: vec3,
      a: Immutable<vec3>,
      b: Immutable<vec3>,
    ): vec3
    export function dot(a: Immutable<vec3>, b: Immutable<vec3>): number
    export function sub(out: vec3, a: Immutable<vec3>, b: Immutable<vec3>): vec3
    export function subtract(
      out: vec3,
      a: Immutable<vec3>,
      b: Immutable<vec3>,
    ): vec3
    export function transformQuat(
      out: vec3,
      a: Immutable<vec3>,
      b: Immutable<quat>,
    ): vec3
  }

  export namespace vec4 {
    export function clone(a: Immutable<vec4>): vec4
    export function equals(a: Immutable<vec4>, b: Immutable<vec4>): boolean
  }

  export namespace quat {
    export function setAxisAngle(
      out: quat,
      axis: Immutable<vec3>,
      rad: number,
    ): quat
  }

  // Any type that extends Float32Array
  export type DerivedFloat32Array =
    | Float32Array
    | mat2
    | mat2d
    | mat3
    | mat4
    | quat
    | quat2
    | vec2
    | vec3
    | vec4
}
