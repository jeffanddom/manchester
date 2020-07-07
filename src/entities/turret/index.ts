import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { MotionScript } from '~/entities/turret/MotionScript'
import { ShooterScript } from '~/entities/turret/ShooterScript'
import { TurretRenderables } from '~/entities/turret/TurretRenderables'
import { Hitbox } from '~/Hitbox'

export const makeTurret = (_model: {
  path: Array<vec2>
  fillStyle: string
}): Entity => {
  const transform = new Transform()

  const e = new Entity()
  e.transform = transform

  e.motionScript = new MotionScript()
  e.shooterScript = new ShooterScript()

  e.wall = true
  e.enemy = true
  e.damageable = new Damageable(
    3,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.5, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE, TILE_SIZE),
      false,
    ),
  )
  e.renderable = new TurretRenderables()

  return e
}
