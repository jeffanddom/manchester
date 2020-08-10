import * as uuid from 'uuid'

import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable, IShooterScript } from '~/components/interfaces'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { TurretComponent } from '~/systems/turret'

export class Entity {
  id: string

  // flags
  dropType?: PickupType
  harvestType?: PickupType
  enablePlayfieldClamping?: boolean
  obscured: boolean
  obscuring: boolean
  pickupType?: PickupType
  targetable: boolean
  team: Team
  wall: boolean
  wallCollider: boolean

  // components
  builder?: BuilderComponent
  bullet?: Bullet
  damageable?: Damageable
  damager?: Damager
  hitbox?: Hitbox
  inventory?: PickupType[]
  renderable?: IRenderable
  shooterScript?: IShooterScript
  transform?: Transform
  turret?: TurretComponent

  constructor() {
    this.id = uuid.v4()

    this.wall = false
    this.wallCollider = false
    this.targetable = false
    this.obscuring = false
    this.obscured = false
    this.enablePlayfieldClamping = false
    this.team = Team.Neutral
  }
}
