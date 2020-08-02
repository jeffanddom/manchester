import { mat2d } from 'gl-matrix'

import { IRenderable } from '~/entities/components/interfaces'
import { Entity } from '~/entities/Entity'
import { ShooterScript } from '~/entities/player/ShooterScript'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'

export class PlayerRenderables implements IRenderable {
  shooter: ShooterScript

  constructor(shooter: ShooterScript) {
    this.shooter = shooter
  }

  getRenderables(e: Entity): Renderable[] {
    return toRenderables(models.tank, {
      worldTransform: mat2d.fromTranslation(
        mat2d.create(),
        e.transform!.position,
      ),
      itemTransforms: {
        body: mat2d.fromRotation(mat2d.create(), e.transform!.orientation),
        gun: mat2d.fromRotation(mat2d.create(), this.shooter.orientation),
      },
    })
  }
}
