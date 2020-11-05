import { mat2d } from 'gl-matrix'

import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'

export class TurretRenderables implements IRenderable {
  getRenderables(
    entityManager: EntityManager,
    entityId: EntityId,
  ): Renderable[] {
    const t = entityManager.transforms.get(entityId)!
    const team = entityManager.teams.get(entityId)

    return toRenderables(models.turret, {
      worldTransform: mat2d.fromTranslation(mat2d.create(), t.position),
      itemTransforms: {
        gun: mat2d.fromRotation(mat2d.create(), t.orientation),
      },
      itemFillStyles: {
        base: team === Team.Friendly ? 'blue' : 'red',
      },
    })
  }
}
