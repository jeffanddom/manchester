import * as uuid from 'uuid'

import { Damageable } from './components/Damageable'

import {
  IDamagerLogic,
  IGenericComponent,
  IMotionLogic,
  IRenderable,
  IShooterLogic,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Game } from '~/Game'

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
  prerender?: IGenericComponent

  constructor() {
    this.id = uuid.v4()
    this.wall = false
    this.wallCollider = false
    this.enablePlayfieldClamping = false
  }

  update(game: Game, dt: number): void {
    // Should be the very last thing to update.
    this.prerender?.update(this, game, dt)
  }
}
