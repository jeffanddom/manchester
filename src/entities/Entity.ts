import * as uuid from 'uuid'

import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import {
  IMotionScript,
  IRenderable,
  IShooterScript,
} from '~/components/interfaces'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { TurretComponent } from '~/systems/turret'

export class Entity {
  id: string

  // flags
  wallCollider: boolean
  wall: boolean
  targetable: boolean
  obscuring: boolean
  obscured: boolean
  enablePlayfieldClamping?: boolean
  team: Team
  pickupType?: PickupType
  dropType?: PickupType

  // components
  transform?: Transform
  motionScript?: IMotionScript
  shooterScript?: IShooterScript
  renderable?: IRenderable
  hitbox?: Hitbox
  harmbox?: Hitbox
  damageable?: Damageable
  damager?: Damager
  builder?: BuilderComponent
  turret?: TurretComponent
  inventory?: PickupType[]

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
