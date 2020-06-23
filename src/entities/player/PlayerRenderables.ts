import { mat2d } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { IRenderable } from '~/entities/components/interfaces'
import { Entity } from '~/entities/Entity'
import { ShooterLogic } from '~/entities/player/ShooterLogic'
import { Primitive, Renderable } from '~/renderer/interfaces'
import { path2 } from '~/util/path2'

export class PlayerRenderables implements IRenderable {
  bodyPath: path2
  turretPath: path2
  shooter: ShooterLogic

  constructor(shooter: ShooterLogic) {
    this.shooter = shooter
    this.turretPath = path2.fromValues([
      [-TILE_SIZE * 0.1, -TILE_SIZE * 0.7],
      [TILE_SIZE * 0.1, -TILE_SIZE * 0.7],
      [TILE_SIZE * 0.2, TILE_SIZE * 0.3],
      [-TILE_SIZE * 0.2, TILE_SIZE * 0.3],
    ])
    this.bodyPath = path2.fromValues([
      [-TILE_SIZE * 0.3, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.3, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.4, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.4, TILE_SIZE * 0.5],
    ])
  }

  setFillStyle(_s: string): void {
    // unimplemented
  }

  getRenderables(e: Entity): Renderable[] {
    const t = mat2d.fromTranslation(mat2d.create(), e.transform!.position)
    const r = mat2d.fromRotation(mat2d.create(), this.shooter.orientation)
    const turretTransform = mat2d.multiply(mat2d.create(), t, r)

    return [
      {
        primitive: Primitive.PATH,
        fillStyle: 'black',
        mwTransform: e.transform!.mwTransform(),
        path: this.bodyPath,
      },
      {
        primitive: Primitive.PATH,
        fillStyle: 'red',
        mwTransform: turretTransform,
        path: this.turretPath,
      },
    ]
  }
}
