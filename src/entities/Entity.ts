import * as uuid from 'uuid'

import { Damageable } from './components/Damageable'

import {
  IDamagerLogic,
  IMotionLogic,
  IPrerenderLogic,
  IRenderable,
  IShooterLogic,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'

export class Entity {
  id: string
  transform?: Transform
  motionLogic?: IMotionLogic
  shooterLogic?: IShooterLogic
  wallCollider: boolean
  wall: boolean
  renderable?: IRenderable
  damageable?: Damageable
  damagerLogic?: IDamagerLogic
  enablePlayfieldClamping?: boolean
  prerenderLogic?: IPrerenderLogic

  constructor() {
    this.id = uuid.v4()
    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
  }
}
