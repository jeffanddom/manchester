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
  prerender?: IGenericComponent

  constructor() {}

  update(game: IGame) {
    this.transform?.update()
    this.mover?.update(this, game)
    this.wall?.update(this, game)
    this.wallCollider?.update(this, game)
    this.shooter?.update(this, game)
    this.damager?.update(this, game)
    this.damageable?.update(this, game)

    // This should be the last component to update
    this.prerender?.update(this, game)
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.pathRenderable?.render(this, ctx)
  }
}
