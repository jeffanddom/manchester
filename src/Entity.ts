import {
  ITransform,
  IGenericComponent,
  IEntity,
  IGame,
  IWallCollider,
} from './common'

export class Entity implements IEntity {
  id?: string
  game?: IGame
  transform?: ITransform
  playerControl?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  script?: IGenericComponent

  constructor() {}

  update() {
    this.transform?.update(this)
    this.playerControl?.update(this)
    this.script?.update(this)
    this.wall?.update(this)
    this.wallCollider?.update(this)
    this.shooter?.update(this)
  }

  render(ctx: CanvasRenderingContext2D): void {}
}
