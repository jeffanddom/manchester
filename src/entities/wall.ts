import { mat2d, vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { IRenderable } from '~/components/IRenderable'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'
import { lerp } from '~/util/math'

const WALL_HEALTH = 4.0

class WallRenderable implements IRenderable {
  getRenderables(
    entityManager: EntityManager,
    entityId: EntityId,
  ): Renderable[] {
    const damageable = entityManager.damageables.get(entityId)!
    const transform = entityManager.transforms.get(entityId)!

    const color = lerp(90, 130, damageable.health / WALL_HEALTH)

    return toRenderables(models.wall, {
      worldTransform: mat2d.fromTranslation(mat2d.create(), transform.position),
      itemTransforms: {
        gun: mat2d.fromRotation(mat2d.create(), transform.orientation),
      },
      itemFillStyles: {
        body: `rgba(${color},${color},${color},1)`,
      },
    })
  }
}

export const makeWall = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.WALL

  e.transform = transform.make()
  e.wall = true
  e.targetable = true
  e.renderable = new WallRenderable()
  e.damageable = new Damageable(
    WALL_HEALTH,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  return e
}
