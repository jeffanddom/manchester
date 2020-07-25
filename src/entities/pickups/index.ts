import { PickupType } from '~/entities/pickup'
import { makeNadaPickup } from '~/entities/pickups/Nada'

export const PickupConstructors = {
  [PickupType.Core]: makeNadaPickup,
}
