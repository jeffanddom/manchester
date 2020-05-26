import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import {
  ITransform,
  IGenericComponent,
  IWallCollider,
  IPathRenderable,
  IDamageable,
  IDamager,
} from '~/entities/components/interfaces'
import { Camera } from '~/Camera'

export class Entity implements IEntity {
  id?: string
  transform?: ITransform
  mover?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  pathRenderable?: IPathRenderable
  damageable?: IDamageable
  damager?: IDamager
  playfieldClamper?: IGenericComponent
  prerender?: IGenericComponent

  constructor() {}

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

  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    this.pathRenderable?.render(this, ctx, camera)
  }
}
