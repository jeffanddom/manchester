import { EntityComponents } from '~/engine/state/EntityComponents'
import { makeCorePickup } from '~/game/entities/pickups/core'
import { makePlayer } from '~/game/entities/player'
import { makeTree } from '~/game/entities/tree'
import { makeTurret } from '~/game/entities/turret'
import { makeWall } from '~/game/entities/wall'

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
