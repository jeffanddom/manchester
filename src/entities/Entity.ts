import * as uuid from 'uuid'

import { Builder } from '~/entities/builder/Builder'
import { Damageable } from '~/entities/components/Damageable'
import { Damager } from '~/entities/components/Damager'
import {
  IMotionScript,
  IRenderable,
  IShooterScript,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { PickupType } from '~/entities/pickup'
import { Team } from '~/entities/team'
import { Turret } from '~/entities/turret/Turret'
import { Hitbox } from '~/Hitbox'

export class Entity {
  id: string

  // flags
  wallCollider: boolean
  wall: boolean
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
  builder?: Builder
  turret?: Turret
  inventory?: PickupType[]

  constructor() {
    this.id = uuid.v4()

    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
    this.team = Team.Neutral
  }
}
