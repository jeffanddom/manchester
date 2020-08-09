import { vec2 } from 'gl-matrix'

import { Damager } from '~/components/Damager'
import { DefaultModelRenderable } from '~/components/DefaultModelRenderable'
import { IMotionScript } from '~/components/interfaces'
import { Transform } from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import * as models from '~/models'
import { radialTranslate2 } from '~/util/math'

const BULLET_SPEED = 60 * (TILE_SIZE / 8)

class MotionScript implements IMotionScript {
  origin: vec2
  range: number

  constructor(origin: vec2, range: number) {
    this.origin = origin
    this.range = range
  }

  update(transform: Transform, entityId: string, game: Game, dt: number): void {
    radialTranslate2(
      transform.position,
      transform.position,
      transform.orientation,
      BULLET_SPEED * dt,
    )

    if (vec2.distance(transform.position, this.origin) >= this.range) {
      game.entities.markForDeletion(entityId)
      return
    }
  }
}

export const makeBullet = ({
  position,
  orientation,
  range,
}: {
  position: vec2
  orientation: number
  range: number
}): Entity => {
  const e = new Entity()

  e.transform = new Transform()
  e.transform.position = vec2.clone(position)
  e.transform.orientation = orientation

  e.motionScript = new MotionScript(vec2.clone(position), range)
  e.renderable = new DefaultModelRenderable(models.bullet)

  e.damager = new Damager(
    1,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.1, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.2, TILE_SIZE * 0.2),
    ),
  )

  return e
}
