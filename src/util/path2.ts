import { vec2 } from 'gl-matrix'

/**
 * path2 is an array of vec2 objects.
 */
export class path2 extends Array<vec2> {
  public static fromValues(raw: [number, number][]): path2 {
    return raw.map((r) => vec2.fromValues(r[0], r[1]))
  }
}
