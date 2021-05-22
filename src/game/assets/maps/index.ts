import * as bigMap from './bigMap.json'
import * as collisionTest from './collisionTest.json'
import * as quadtreeTest from './quadtreeTest.json'

export const maps = new Map(
  Object.entries({
    bigMap,
    collisionTest,
    quadtreeTest,
  }),
)
