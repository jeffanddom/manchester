import { Entity } from '~/entities/Entity'
import { makeNadaPickup } from '~/entities/pickups/Nada'
import { makePlayer } from '~/entities/player'
import { makeTurret } from '~/entities/turret'
import { makeWall } from '~/entities/Wall'
import * as models from '~/models'

export enum Type {
  PLAYER = 'PLAYER',
  TURRET = 'TURRET',
  WALL = 'WALL',
  NADA = 'NADA',
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
