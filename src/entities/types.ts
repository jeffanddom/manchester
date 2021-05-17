import { makeCorePickup } from '~/entities/pickups/core'
import { makePlayer } from '~/entities/player'
import { makeTree } from '~/entities/tree'
import { makeTurret } from '~/entities/turret'
import { makeWall } from '~/entities/wall'
import { EntityComponents } from '~/sim/EntityComponents'

export enum Type {
  PLAYER = 'PLAYER',
  TURRET = 'TURRET',
  WALL = 'WALL',
  CORE = 'CORE',
  TREE = 'TREE',
}

export const typeDefinitions = {
  [Type.PLAYER]: {
    make: makePlayer,
  },
  [Type.TURRET]: {
    make: makeTurret,
  },
  [Type.WALL]: {
    make: makeWall,
  },
  [Type.CORE]: {
    make: makeCorePickup,
  },
  [Type.TREE]: {
    make: makeTree,
  },
}

export const make = (t: Type): EntityComponents => {
  for (const k in typeDefinitions) {
    if (k !== t) {
      continue
    }
    const def = typeDefinitions[k]
    return def.make()
  }
  throw new Error(`invalid entity type ${t}`)
}
