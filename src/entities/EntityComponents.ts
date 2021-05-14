import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { EntityModel } from '~/components/EntityModel'
import { Hitbox } from '~/components/Hitbox'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { Transform3 } from '~/components/Transform3'
import { Type } from '~/entities/types'
import { Builder } from '~/systems/builder'
import { Damager } from '~/systems/damager'
import { EmitterComponent } from '~/systems/emitter'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TankMoverComponent } from '~/systems/tankMover'
import { TurretComponent } from '~/systems/turret'

export interface EntityComponents {
  bullet?: Bullet
  damageable?: Damageable
  damager?: Damager
  dropType?: PickupType
  emitter?: EmitterComponent
  entityModel?: EntityModel
  explosion?: boolean
  hitbox?: Hitbox
  moveable?: boolean
  obscured?: boolean
  obscuring?: boolean
  playerNumber?: number
  playfieldClamped?: boolean
  renderable?: string
  shooter?: ShooterComponent
  tankMover?: TankMoverComponent
  targetable?: boolean
  team?: Team
  transform?: Transform
  transform3?: Transform3
  turret?: TurretComponent
  type?: Type
  wall?: boolean

  // Components that are currently not used by simulation
  builder?: Builder
  harvestType?: PickupType
  inventory?: PickupType[]
  pickupType?: PickupType
}

export const makeDefaultEntity = (): EntityComponents => {
  return { team: Team.Neutral }
}
