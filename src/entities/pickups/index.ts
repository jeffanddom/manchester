import { makeNadaPickup } from '~/entities/pickups/Nada'
import { PickupType } from '~/systems/pickups'

export const PickupConstructors = {
  [PickupType.Core]: makeNadaPickup,
}
