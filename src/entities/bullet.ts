import { vec2, vec4 } from 'gl-matrix'

import * as bullet from '~/components/Bullet'
import * as transform from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'

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
  e.entityModel = {
    name: 'bullet',
    color: vec4.fromValues(1, 0, 0, 1),
    modifiers: {},
  }

  e.damager = {
    damageValue: 1,
    hitbox: {
      offset: vec2.fromValues(-TILE_SIZE / 12, -TILE_SIZE / 12),
      dimensions: vec2.fromValues(TILE_SIZE / 6, TILE_SIZE / 6),
    },
    immuneList: [owner],
  }

  return e
}
