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
  bullet?: Bullet
  damager?: Damager
  dropType?: PickupType
  harvestType?: PickupType
  hitbox?: Hitbox
  inventory?: PickupType[]
  pickupType?: PickupType
  playerNumber?: number
  playfieldClamped?: boolean
  renderable?: IRenderable
  shooter?: ShooterComponent
  team?: Team
  turret?: TurretComponent
  type?: Type

  // The following properties should only be used for creation, not snapshotting
  damageable?: Damageable
  moveable?: boolean
  obscured?: boolean
  obscuring?: boolean
  targetable?: boolean
  transform?: Transform
  wall?: boolean
}

export const makeDefaultEntity = (): EntityComponents => {
  return { team: Team.Neutral }
}
