import * as bigMap from '~/assets/maps/bigMap.json'
import * as collisionTest from '~/assets/maps/collisionTest.json'
import * as quadtreeTest from '~/assets/maps/quadtreeTest.json'
import { RawMap } from '~/map/interfaces'

console.log(quadtreeTest)

export const maps: { [key: string]: RawMap } = {
  bigMap,
  collisionTest,
  quadtreeTest,
}
