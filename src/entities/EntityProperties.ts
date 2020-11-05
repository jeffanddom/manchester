import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { ITransform } from '~/components/transform'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent, BuilderCreator } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'

export interface EntityProperties {
  builder?: BuilderComponent
  builderCreator?: BuilderCreator
  bullet?: Bullet
  damageable?: Damageable
  damager?: Damager
  dropType?: PickupType
  harvestType?: PickupType
  hitbox?: Hitbox
  inventory?: PickupType[]
  moveable: boolean
  obscured: boolean
  obscuring: boolean
  pickupType?: PickupType
  playerNumber?: number
  playfieldClamped?: boolean
  renderable?: IRenderable
  shooter?: ShooterComponent
  targetable: boolean
  team: Team
  transform?: ITransform
  turret?: TurretComponent
  type?: Type
  wall: boolean
}

export const makeDefaultEntity = (): EntityProperties => {
  return {
    moveable: false,
    obscured: false,
    obscuring: false,
    playfieldClamped: false,
    targetable: false,
    team: Team.Neutral,
    wall: false,
  }
}
