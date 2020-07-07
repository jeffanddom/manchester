import { mat2d, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IRenderable } from '~/entities/components/interfaces'
import { Entity } from '~/entities/Entity'
import { Primitive, Renderable } from '~/renderer/interfaces'
import { vec2FromValuesBatch } from '~/util/math'

export class TurretRenderables implements IRenderable {
  turretPath: Array<vec2>

  constructor() {
    this.turretPath = vec2FromValuesBatch([
      [-TILE_SIZE * 0.1, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.2, TILE_SIZE * 0.3],
      [-TILE_SIZE * 0.2, TILE_SIZE * 0.3],
    ])
  }

  setFillStyle(_s: string): void {
    // unimplemented
  }

  getRenderables(e: Entity): Renderable[] {
    const t = mat2d.fromTranslation(mat2d.create(), e.transform!.position)
    const r = mat2d.fromRotation(mat2d.create(), e.transform!.orientation)
    const turretTransform = mat2d.multiply(mat2d.create(), t, r)

    return [
      {
        primitive: Primitive.CIRCLE,
        fillStyle: 'red',
        pos: e.transform!.position,
        radius: TILE_SIZE * 0.45,
      },
      {
        primitive: Primitive.PATH,
        fillStyle: 'yellow',
        mwTransform: turretTransform,
        path: this.turretPath,
      },
    ]
  }
}
