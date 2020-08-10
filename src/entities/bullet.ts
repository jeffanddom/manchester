import { vec2 } from 'gl-matrix'

import { Bullet } from '~/components/Bullet'
import { Damager } from '~/components/Damager'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import { Transform } from '~/components/Transform'
import { Entity } from '~/entities/Entity'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'

export const makeBullet = ({
  position,
  owner,
  orientation,
}: {
  position: vec2
  owner: string
  orientation: number
}): Entity => {
  const e = new Entity()

  e.transform = new Transform()
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
