import { vec2 } from 'gl-matrix'

import { Damageable } from '~/components/Damageable'
import { Team } from '~/components/team'
import * as transform from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import {
  EntityProperties,
  makeDefaultEntity,
} from '~/entities/EntityProperties'
import { PlayerRenderables } from '~/entities/player/PlayerRenderables'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { BuilderCreator } from '~/systems/builder'
import { ShooterComponent } from '~/systems/shooter'

export const makePlayer = (): EntityProperties => {
  const e = makeDefaultEntity()
  e.type = Type.PLAYER

  e.playfieldClamped = true
  e.targetable = true
  e.team = Team.Friendly
  e.moveable = true

  const shooter = new ShooterComponent()
  e.builderCreator = new BuilderCreator()
  e.damageable = new Damageable(
    10,
    new Hitbox(
      vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
      vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
    ),
  )
  e.inventory = []
  e.renderable = new PlayerRenderables()
  e.hitbox = new Hitbox(
    vec2.fromValues(-TILE_SIZE * 0.3, -TILE_SIZE * 0.5),
    vec2.fromValues(TILE_SIZE * 0.6, TILE_SIZE),
  )
  e.shooter = shooter

  e.transform = transform.make()

  return e
}
