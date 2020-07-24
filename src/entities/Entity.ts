import * as uuid from 'uuid'

import { Builder } from '~/entities/builder/Builder'
import { Damageable } from '~/entities/components/Damageable'
import { Damager } from '~/entities/components/Damager'
import {
  IMotionScript,
  IPickupScript,
  IPrerenderScript,
  IRenderable,
  IShooterScript,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Team } from '~/entities/team'
import { Turret } from '~/entities/turret/Turret'

export class Entity {
  id: string

  // flags
  wallCollider: boolean
  wall: boolean
  enablePlayfieldClamping?: boolean
  team: Team

  // components
  transform?: Transform
  motionScript?: IMotionScript
  shooterScript?: IShooterScript
  renderable?: IRenderable
  damageable?: Damageable
  damager?: Damager
  prerenderScript?: IPrerenderScript
  pickupScript?: IPickupScript
  builder?: Builder
  turret?: Turret

  constructor() {
    this.id = uuid.v4()

    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
    this.team = Team.Neutral
  }
}
