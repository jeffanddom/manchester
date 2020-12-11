import { vec2 } from 'gl-matrix'

import * as bullet from '~/components/Bullet'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import * as transform from '~/components/Transform'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import * as models from '~/models'

export const makeBullet = ({
  position,
  owner,
  orientation,
}: {
  position: vec2
  owner: EntityId
  orientation: number
}): EntityComponents => {
  const e = makeDefaultEntity()

  e.moveable = true

  e.transform = transform.make()
  e.transform.position = vec2.clone(position)
  e.transform.orientation = orientation

  e.bullet = bullet.make(e.transform.position)
  e.renderable = 'bullet'

  e.damager = {
    damageValue: 1,
    hitbox: {
      offset: vec2.fromValues(-2, -2),
      dimensions: vec2.fromValues(4, 4),
    },
    immuneList: [owner],
  }

  return e
}
