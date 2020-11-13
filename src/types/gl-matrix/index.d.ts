/**
 * A typing monkey patch for glMatrix, replacing ReadonlyXYZ with Immutable<XYZ>.
 */

import { Immutable } from '../immutable'

declare module 'gl-matrix' {
  export namespace mat2d {
    export function fromTranslation(out: mat2d, v: Immutable<vec2>): mat2d
  }

  export namespace vec2 {
    export function add(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function clone(a: Immutable<vec2>): vec2
    export function distance(a: Immutable<vec2>, b: Immutable<vec2>): number
    export function equals(a: Immutable<vec2>, b: Immutable<vec2>): boolean
    export function max(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function min(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function scale(out: vec2, a: Immutable<vec2>, b: number): vec2
    export function sub(out: vec2, a: Immutable<vec2>, b: Immutable<vec2>): vec2
    export function subtract(
      out: vec2,
      a: Immutable<vec2>,
      b: Immutable<vec2>,
    ): vec2
  }
}
