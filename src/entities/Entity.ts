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
  playfieldClamper?: IGenericComponent
  prerender?: IGenericComponent

  constructor() {
    this.id = uuid.v4()
    this.wall = false
    this.wallCollider = false
  }

  update(game: Game, dt: number): void {
    // Should go after any business logic that modifies the
    // transform.
    this.playfieldClamper?.update(this, game, dt)

    // Should be the very last thing to update.
    this.prerender?.update(this, game, dt)
  }
}
