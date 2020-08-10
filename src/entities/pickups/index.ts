import { makeNadaPickup } from '~/entities/pickups/nada'
import { makeWoodPickup } from '~/entities/pickups/wood'
import { PickupType } from '~/systems/pickups'

export const PickupConstructors = {
  [PickupType.Core]: makeNadaPickup,
  [PickupType.Wood]: makeWoodPickup,
}
