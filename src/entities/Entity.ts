import * as uuid from 'uuid'

import { Damageable } from './components/Damageable'
import { WallCollider } from './components/WallCollider'

import {
  IDamager,
  IGenericComponent,
  IMotionLogic,
  IRenderable,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Game } from '~/Game'

export class Entity {
  id: string
  transform?: Transform
  motionLogic?: IMotionLogic
  shooter?: IGenericComponent
  wallCollider?: WallCollider
  wall: boolean
  renderable?: IRenderable
  damageable?: Damageable
  damager?: IDamager
  playfieldClamper?: IGenericComponent
  prerender?: IGenericComponent

  constructor() {
    this.id = uuid.v4()
    this.wall = false
  }

  update(game: Game, dt: number): void {
    this.wallCollider?.update(this, game)
    this.shooter?.update(this, game, dt)
    this.damager?.update(this, game, dt)
    this.damageable?.update(this, game, dt)

    // Should go after any business logic that modifies the
    // transform.
    this.playfieldClamper?.update(this, game, dt)

    // Should be the very last thing to update.
    this.prerender?.update(this, game, dt)
  }
}
