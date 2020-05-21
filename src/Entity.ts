import {
  ITransform,
  IGenericComponent,
  IEntity,
  IGame,
  IWallCollider,
  IPathRenderable,
  IDamageable,
  IDamager,
} from './common'

export class Entity implements IEntity {
  id?: string
  game?: IGame
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

  update() {
    this.transform?.update(this)
    this.mover?.update(this)
    this.wall?.update(this)
    this.wallCollider?.update(this)
    this.shooter?.update(this)
    this.damager?.update(this)
    this.damageable?.update(this)
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.prerender?.update(this)
    this.pathRenderable?.render(this, ctx)
  }
}
