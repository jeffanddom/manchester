import { vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { Damageable } from '~/entities/components/Damageable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { PlayerRenderables } from '~/entities/player/PlayerRenderables'
import { ShooterScript } from '~/entities/player/ShooterScript'
import { Team } from '~/entities/team'
import { Hitbox } from '~/Hitbox'

export const makePlayer = (): Entity => {
  const shooterScript = new ShooterScript()
  const e = new Entity()
  e.transform = new Transform()
  e.shooterScript = shooterScript
  e.wallCollider = true
  e.targetable = true
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
    false,
  )
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
      false,
    ),
  )
  e.enablePlayfieldClamping = true
  e.renderable = new PlayerRenderables(shooterScript)
  e.team = Team.Friendly
  e.inventory = []

  return e
}
