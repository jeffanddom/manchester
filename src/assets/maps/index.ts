import * as bigMap from '~/assets/maps/bigMap.json'
import * as collisionTest from '~/assets/maps/collisionTest.json'
import { RawMap } from '~/map/interfaces'

export const maps: { [key: string]: RawMap } = { bigMap, collisionTest }
