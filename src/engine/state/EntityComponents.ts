import { Bullet } from '~/game/components/Bullet'
import { Damageable } from '~/game/components/Damageable'
import { EntityModel } from '~/game/components/EntityModel'
import { Hitbox } from '~/game/components/Hitbox'
import { Team } from '~/game/components/team'
import { Transform } from '~/game/components/Transform'
import { Transform3 } from '~/game/components/Transform3'
import { Type } from '~/game/entities/types'
import { Builder } from '~/game/systems/builder'
import { Damager } from '~/game/systems/damager'
import { EmitterComponent } from '~/game/systems/emitter'
import { PickupType } from '~/game/systems/pickups'
import { ShooterComponent } from '~/game/systems/shooter'
import { TankMoverComponent } from '~/game/systems/tankMover'
import { TurretComponent } from '~/game/systems/turret'

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
