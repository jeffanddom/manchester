import { Entity } from '~/entities/Entity'
import { makeCorePickup } from '~/entities/pickups/core'
import { makePlayer } from '~/entities/player'
import { makeTree } from '~/entities/tree'
import { makeTurret } from '~/entities/turret'
import { makeWall } from '~/entities/wall'
import * as models from '~/models'

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
    editorModel: models.tank,
  },
  [Type.TURRET]: {
    make: makeTurret,
    editorModel: models.turret,
  },
  [Type.WALL]: {
    make: makeWall,
    editorModel: models.wall,
  },
  [Type.CORE]: {
    make: makeCorePickup,
    editorModel: models.pickup,
  },
  [Type.TREE]: {
    make: makeTree,
    editorModel: models.tree,
  },
}

export const make = (t: Type): Entity => {
  for (const k in typeDefinitions) {
    if (k !== t) {
      continue
    }
    const def = typeDefinitions[k]
    return def.make()
  }
  throw new Error(`invalid entity type ${t}`)
}
