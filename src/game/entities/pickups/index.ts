import { makeCorePickup } from '~/game/entities/pickups/core'
import { makeWoodPickup } from '~/game/entities/pickups/wood'
import { PickupType } from '~/game/systems/pickups'

export const PickupConstructors = {
  [PickupType.Core]: makeCorePickup,
  [PickupType.Wood]: makeWoodPickup,
}
