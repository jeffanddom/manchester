import { mat2d } from 'gl-matrix'

import { IRenderable } from '~/components/IRenderable'
import { Entity } from '~/entities/Entity'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'
import { ShooterComponent } from '~/systems/shooter'

export class PlayerRenderables implements IRenderable {
  shooter: ShooterComponent

  constructor(shooter: ShooterComponent) {
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
      itemFillStyles: {
        body: e.obscured ? 'rgba(0,0,0,0.65)' : 'black',
        gun: e.obscured ? 'rgba(255,0,0,0.65)' : 'red',
      },
    })
  }
}
