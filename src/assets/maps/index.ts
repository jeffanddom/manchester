import * as bigMap from '~/assets/maps/bigMap.json'
import * as collisionTest from '~/assets/maps/collisionTest.json'
import * as quadtreeTest from '~/assets/maps/quadtreeTest.json'

export const maps = new Map(
  Object.entries({
    bigMap,
    collisionTest,
    quadtreeTest,
  }),
)
