import { IGame } from '~/interfaces'
import {
  IGenericComponent,
  IWallCollider,
  IDamageable,
  IDamager,
  IRenderable,
} from '~/entities/components/interfaces'
import { Camera } from '~/Camera'
import { Transform } from './components/Transform'

export interface IEntityManager {
  entities: { [key: string]: IEntity }

  register: (e: IEntity) => void
  markForDeletion: (e: IEntity) => void

  update: (game: IGame, dt: number) => void
  render: (ctx: CanvasRenderingContext2D, camera: Camera) => void
}

export interface IEntity {
  id?: string
  transform?: Transform
  mover?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  damageable?: IDamageable
  damager?: IDamager
  prerender?: IGenericComponent
  renderable?: IRenderable

  update: (g: IGame, dt: number) => void
}
