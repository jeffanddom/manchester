/**
 * A typing monkey patch for glMatrix, replacing ReadonlyXYZ with Immutable<XYZ>.
 */

import { Immutable } from '../immutable'

declare module 'gl-matrix' {
  export namespace mat2d {
    export function fromTranslation(out: mat2d, v: Immutable<vec2>): mat2d
  }

  export namespace mat4 {
    export function multiply(
      out: mat4,
      a: Immutable<mat4>,
      b: Immutable<mat4>,
    ): mat4

    // TODO: glMatrix type annotations are not strict. invert() will return null
    // if the determinant is zero, i.e., if the matrix is not invertible.
    // export function invert(out: mat4, input: mat4): mat4 | null
  }

  export namespace vec2 {
    export function add(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function clone(a: Immutable<vec2>): vec2
    export function copy(out: vec2, a: Immutable<vec2>): vec2
    export function distance(a: Immutable<vec2>, b: Immutable<vec2>): number
    export function equals(a: Immutable<vec2>, b: Immutable<vec2>): boolean
    export function max(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function min(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function scale(out: vec2, a: Immutable<vec2>, b: number): vec2
    export function squaredDistance(
      a: Immutable<vec2>,
      b: Immutable<vec2>,
    ): number
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
    export function sub(out: vec3, a: Immutable<vec3>, b: Immutable<vec3>): vec3
    export function subtract(
      out: vec3,
      a: Immutable<vec3>,
      b: Immutable<vec3>,
    ): vec3
  }

  export namespace vec4 {
    export function clone(a: Immutable<vec4>): vec4
  }
}
