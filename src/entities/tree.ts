import { mat2d, vec2 } from 'gl-matrix'
import { sample } from 'lodash'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { IRenderable } from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Hitbox } from '~/Hitbox'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'

const TREE_HEALTH = 0.1

class TreeRenderable implements IRenderable {
  fillStyle: string

  constructor() {
    this.fillStyle = sample(['green', 'forestgreen', 'darkgreen']) || 'green'
  }
  getRenderables(e: Entity): Renderable[] {
    return toRenderables(models.tree, {
      worldTransform: mat2d.fromTranslation(
        mat2d.create(),
        e.transform!.position,
      ),
      itemFillStyles: {
        body: this.fillStyle,
      },
    })
  }
}

export const makeTree = (): Entity => {
  const e = new Entity()
  e.obscuring = true
  e.transform = new Transform()
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
