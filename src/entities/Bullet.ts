import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damager } from '~/entities/components/Damager'
import { IMotionScript } from '~/entities/components/interfaces'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Hitbox } from '~/Hitbox'
import { radialTranslate2, vec2FromValuesBatch } from '~/util/math'

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
  e.renderable = new PathRenderable(
    vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.1, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.1, TILE_SIZE * 0.5],
    ]),
    '#FF0000',
  )

  e.damager = new Damager(
    1,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.1, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.2, TILE_SIZE * 0.2),
    ),
  )

  return e
}
