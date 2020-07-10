import * as uuid from 'uuid'

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

export class Entity {
  id: string

  // flags
  wallCollider: boolean
  wall: boolean
  enablePlayfieldClamping?: boolean
  enemy: boolean

  // components
  transform?: Transform
  motionScript?: IMotionScript
  shooterScript?: IShooterScript
  renderable?: IRenderable
  damageable?: Damageable
  damager?: Damager
  prerenderScript?: IPrerenderScript
  pickupScript?: IPickupScript

  constructor() {
    this.id = uuid.v4()

    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
    this.enemy = false
  }
}
