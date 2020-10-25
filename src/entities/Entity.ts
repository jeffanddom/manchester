import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { ITransform } from '~/components/transform'
import { EntityId } from '~/entities/EntityId'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent, BuilderCreator } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'

export interface Entity {
  id: EntityId
  type?: Type

  // flags
  dropType?: PickupType
  harvestType?: PickupType
  enablePlayfieldClamping?: boolean
  obscured: boolean
  obscuring: boolean
  playerNumber?: number
  pickupType?: PickupType
  targetable: boolean
  team: Team
  wall: boolean
  wallCollider: boolean

  // data types
  transform?: ITransform

  // classes
  builderCreator?: BuilderCreator
  builder?: BuilderComponent
  bullet?: Bullet
  damageable?: Damageable
  damager?: Damager
  hitbox?: Hitbox
  inventory?: PickupType[]
  renderable?: IRenderable
  shooter?: ShooterComponent
  turret?: TurretComponent
}

export const makeDefaultEntity = (): Entity => {
  return {
    id: '' as EntityId,
    enablePlayfieldClamping: false,
    obscured: false,
    obscuring: false,
    targetable: false,
    team: Team.Neutral,
    wall: false,
    wallCollider: false,
  }
}
