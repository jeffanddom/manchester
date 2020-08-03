import { Entity } from '~/entities/Entity'
import { makeNadaPickup } from '~/entities/pickups/Nada'
import { makePlayer } from '~/entities/player'
import { makeTree } from '~/entities/Tree'
import { makeTurret } from '~/entities/turret'
import { makeWall } from '~/entities/Wall'
import * as models from '~/models'

export enum Type {
  PLAYER = 'PLAYER',
  TURRET = 'TURRET',
  WALL = 'WALL',
  NADA = 'NADA',
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
  [Type.NADA]: {
    make: makeNadaPickup,
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
