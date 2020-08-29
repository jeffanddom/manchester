import { makeCorePickup } from '~/entities/pickups/core'
import { makeWoodPickup } from '~/entities/pickups/wood'
import { PickupType } from '~/systems/pickups'

export const PickupConstructors = {
  [PickupType.Core]: makeCorePickup,
  [PickupType.Wood]: makeWoodPickup,
}
