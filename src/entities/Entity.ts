import * as uuid from 'uuid'

import { Damageable } from './components/Damageable'

import {
  IDamagerScript,
  IMotionScript,
  IPrerenderScript,
  IRenderable,
  IShooterScript,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'

export class Entity {
  id: string
  transform?: Transform
  motionScript?: IMotionScript
  shooterScript?: IShooterScript
  wallCollider: boolean
  wall: boolean
  renderable?: IRenderable
  damageable?: Damageable
  damagerScript?: IDamagerScript
  enablePlayfieldClamping?: boolean
  prerenderScript?: IPrerenderScript

  constructor() {
    this.id = uuid.v4()
    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
  }
}
