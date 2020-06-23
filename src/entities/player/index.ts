import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { PlayfieldClamper } from '~/entities/components/PlayfieldClamper'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { MotionLogic } from '~/entities/player/MotionLogic'
import { PlayerRenderables } from '~/entities/player/PlayerRenderables'
import { ShooterLogic } from '~/entities/player/ShooterLogic'
import { Hitbox } from '~/Hitbox'
import { path2 } from '~/util/path2'

export const makePlayer = (_model: {
  path: path2
  fillStyle: string
}): Entity => {
  const shooterLogic = new ShooterLogic()
  const e = new Entity()
  e.transform = new Transform()
  e.motionLogic = new MotionLogic()
  e.shooterLogic = shooterLogic
  e.wallCollider = true
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
      false,
    ),
  )
  e.playfieldClamper = new PlayfieldClamper()
  e.renderable = new PlayerRenderables(shooterLogic)

  return e
}
