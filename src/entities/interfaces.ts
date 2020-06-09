import {
  IDamageable,
  IDamager,
  IGenericComponent,
  IRenderable,
  IWallCollider,
} from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { IGame } from '~/interfaces'

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
