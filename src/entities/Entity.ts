import * as uuid from 'uuid'

import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import { ITransform } from '~/components/transform'
import { Type } from '~/entities/types'
import { Hitbox } from '~/Hitbox'
import { BuilderComponent, BuilderCreator } from '~/systems/builder'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'

export class Entity {
  id: string
  type?: Type

  // flags
  dropType?: PickupType
  harvestType?: PickupType
  enablePlayfieldClamping?: boolean
  obscured: boolean
  obscuring: boolean
  player: boolean
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

  constructor() {
    this.id = uuid.v4()

    this.enablePlayfieldClamping = false
    this.obscured = false
    this.obscuring = false
    this.player = false
    this.targetable = false
    this.team = Team.Neutral
    this.wall = false
    this.wallCollider = false
  }
}
