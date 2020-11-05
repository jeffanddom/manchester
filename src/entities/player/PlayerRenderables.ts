import { mat2d } from 'gl-matrix'

import { IRenderable } from '~/components/IRenderable'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'

export class PlayerRenderables implements IRenderable {
  getRenderables(
    entityManager: EntityManager,
    entityId: EntityId,
  ): Renderable[] {
    const t = entityManager.transforms.get(entityId)!
    const obscured = entityManager.obscureds.has(entityId)
    const shooter = entityManager.shooters.get(entityId)!

    return toRenderables(models.tank, {
      worldTransform: mat2d.fromTranslation(mat2d.create(), t.position),
      itemTransforms: {
        body: mat2d.fromRotation(mat2d.create(), t.orientation),
        gun: mat2d.fromRotation(mat2d.create(), shooter.orientation),
      },
      itemFillStyles: {
        body: obscured ? 'rgba(0,0,0,0.65)' : 'black',
        gun: obscured ? 'rgba(255,0,0,0.65)' : 'red',
      },
    })
  }
}
