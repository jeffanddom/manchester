import * as uuid from 'uuid'

import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import {
  IGenericComponent,
  IWallCollider,
  IRenderable,
  IDamageable,
  IDamager,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'

export class Entity implements IEntity {
  id: string
  transform?: Transform
  mover?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  renderable?: IRenderable
  damageable?: IDamageable
  damager?: IDamager
  playfieldClamper?: IGenericComponent
  prerender?: IGenericComponent

  constructor() {
    this.id = uuid.v4()
  }

  update(game: IGame, dt: number) {
    this.transform?.update()
    this.mover?.update(this, game, dt)
    this.wall?.update(this, game, dt)
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
