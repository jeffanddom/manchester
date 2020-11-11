import { vec2 } from 'gl-matrix'

import { Bullet } from '~/components/Bullet'
import { Damager } from '~/components/Damager'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import * as transform from '~/components/Transform'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { Hitbox } from '~/Hitbox'
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

  e.bullet = new Bullet(vec2.clone(e.transform.position))
  e.renderable = new DefaultModelRenderable(models.bullet)

  e.damager = new Damager({
    damageValue: 1,
    hitbox: new Hitbox(vec2.fromValues(-2, -2), vec2.fromValues(4, 4)),
    immuneList: [owner],
  })

  return e
}
