import { mat2d } from 'gl-matrix'

import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { Entity } from '~/entities/Entity'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'

export class TurretRenderables implements IRenderable {
  getRenderables(e: Entity): Renderable[] {
    return toRenderables(models.turret, {
      worldTransform: mat2d.fromTranslation(
        mat2d.create(),
        e.transform!.position,
      ),
      itemTransforms: {
        gun: mat2d.fromRotation(mat2d.create(), e.transform!.orientation),
      },
      itemFillStyles: {
        base: e.team === Team.Friendly ? 'blue' : 'red',
      },
    })
  }
}
