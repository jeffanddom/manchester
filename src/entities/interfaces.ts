import { IGame } from '~/interfaces'
import {
  ITransform,
  IGenericComponent,
  IWallCollider,
  IDamageable,
  IDamager,
  IPathRenderable,
} from '~/entities/components/interfaces'
import { Camera } from '~/Camera'

export interface IEntityManager {
  entities: { [key: string]: IEntity }

  register: (e: IEntity) => void
  markForDeletion: (e: IEntity) => void

  update: (game: IGame, dt: number) => void
  render: (ctx: CanvasRenderingContext2D, camera: Camera) => void
}

export interface IEntity {
  id?: string
  transform?: ITransform
  mover?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  damageable?: IDamageable
  damager?: IDamager
  prerender?: IGenericComponent
  pathRenderable?: IPathRenderable

  update: (g: IGame, dt: number) => void
  render: (ctx: CanvasRenderingContext2D, camera: Camera) => void
}
