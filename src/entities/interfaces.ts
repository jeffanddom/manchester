import { IGame } from '~/interfaces'
import {
  IGenericComponent,
  IWallCollider,
  IDamageable,
  IDamager,
  IRenderable,
} from '~/entities/components/interfaces'
import { Transform } from './components/Transform'

export interface IEntity {
  id: string
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
