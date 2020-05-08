import { vec2 } from 'gl-matrix'

/**
 * path2 is an array of vec2 objects.
 */
export class path2 extends Array<vec2> {
  public static fromValues(raw: [number, number][]): path2 {
    return raw.map((r) => vec2.fromValues(r[0], r[1]))
  }

  public static translate(p: path2, offset: vec2): path2 {
    return p.map((v) => vec2.add(vec2.create(), v, offset))
  }

  /**
   * Rotate the provided path by the given angle. Vertices in the path are
   * assumed to be relative to the origin.
   */
  public static rotate(p: path2, angle: number): path2 {
    return p.map((v) => vec2.rotate(vec2.create(), v, [0, 0], angle))
  }

  /**
   * Updates the given render context with a subpath using the points in the
   * provided paths.
   */
  public static applyPath(p: path2, ctx: CanvasRenderingContext2D): void {
    ctx.moveTo(p[0][0], p[0][1])
    for (let i = 1; i < p.length; i++) {
      ctx.lineTo(p[i][0], p[i][1])
    }
  }
}
