import { mat2d, vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { IRenderable } from '~/components/interfaces'
import { Transform } from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { Hitbox } from '~/Hitbox'
import { toRenderables } from '~/Model'
import * as models from '~/models'
import { Renderable } from '~/renderer/interfaces'
import { lerp } from '~/util/math'

const WALL_HEALTH = 4.0

class WallRenderable implements IRenderable {
  getRenderables(e: Entity): Renderable[] {
    const color = lerp(90, 130, e!.damageable!.health / WALL_HEALTH)

    return toRenderables(models.wall, {
      worldTransform: mat2d.fromTranslation(
        mat2d.create(),
        e.transform!.position,
      ),
      itemTransforms: {
        gun: mat2d.fromRotation(mat2d.create(), e.transform!.orientation),
      },
      itemFillStyles: {
        body: `rgba(${color},${color},${color},1)`,
      },
    })
  }
}

export const makeWall = (): Entity => {
  const e = new Entity()
  e.transform = new Transform()
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
