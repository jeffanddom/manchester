import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent, BuilderCreator } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'

export interface EntityComponents {
  builder?: BuilderComponent
  builderCreator?: BuilderCreator
  dropType?: PickupType
  harvestType?: PickupType
  inventory?: PickupType[]
  pickupType?: PickupType
  playerNumber?: number
  renderable?: IRenderable
  team?: Team
  type?: Type

  // The following properties should only be used for creation, not snapshotting
  bullet?: Bullet
  damageable?: Damageable
  damager?: Damager
  hitbox?: Hitbox
  moveable?: boolean
  obscured?: boolean
  obscuring?: boolean
  playfieldClamped?: boolean
  shooter?: ShooterComponent
  targetable?: boolean
  transform?: Transform
  turret?: TurretComponent
  wall?: boolean
}

export const makeDefaultEntity = (): EntityComponents => {
  return { team: Team.Neutral }
}
