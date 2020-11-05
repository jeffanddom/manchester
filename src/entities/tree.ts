import { mat2d, vec2 } from 'gl-matrix'
import { sample } from 'lodash'

import { Damageable } from '~/components/Damageable'
import { IRenderable } from '~/components/IRenderable'
import * as transform from '~/components/transform'
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
import { PickupType } from '~/systems/pickups'

const TREE_HEALTH = 0.1

class TreeRenderable implements IRenderable {
  fillStyle: string

  constructor() {
    this.fillStyle = sample(['green', 'forestgreen', 'darkgreen']) || 'green'
  }
  getRenderables(
    entityManager: EntityManager,
    entityId: EntityId,
  ): Renderable[] {
    const t = entityManager.transforms.get(entityId)!
    return toRenderables(models.tree, {
      worldTransform: mat2d.fromTranslation(mat2d.create(), t.position),
      itemFillStyles: {
        body: this.fillStyle,
      },
    })
  }
}

export const makeTree = (): EntityComponents => {
  const e = makeDefaultEntity()
  e.type = Type.TREE

  e.obscuring = true
  e.harvestType = PickupType.Wood
  e.transform = transform.make()
  e.renderable = new TreeRenderable()
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE, TILE_SIZE),
  )
  e.damageable = new Damageable(
    TREE_HEALTH,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
    ),
  )
  return e
}
